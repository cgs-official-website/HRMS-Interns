import { query } from "../config/db.js";

// Channels
export const getChannels = async (req, res) => {
  try {
    const { companyId } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    let sql = "SELECT *, name as \"displayName\" FROM channels WHERE 1=1";
    const params = [];
    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND company_id = $${params.length}`;
    }
    sql += " ORDER BY created_at ASC";
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("getChannels error:", err);
    res.status(500).json({ error: "Failed to fetch channels." });
  }
};

export const createChannel = async (req, res) => {
  try {
    const { name, displayName, description, isPrivate = false, companyId } = req.body;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const creatorId = req.user?.id || null;
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    const id = "ch_" + (name || "channel").toLowerCase().replace(/[^a-z0-9]/g, "-") + "_" + Math.random().toString(36).substr(2, 6);
    const result = await query(
      `INSERT INTO channels (id, company_id, name, description, created_by, is_private)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, targetCompanyId, displayName || name, description || "", creatorId, isPrivate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("createChannel error:", err);
    res.status(500).json({ error: "Failed to create channel." });
  }
};


const formatMessageRow = (row) => {
  if (!row) return null;
  const pinned = (row.reactions && typeof row.reactions === "object" ? row.reactions.pinned : null) || {};
  const isPinned = Boolean(pinned.isPinned);
  const pinExpiresAt = pinned.pinExpiresAt || pinned.pinnedUntil || null;
  const pinDurationDays = pinned.pinDurationDays || null;
  const pinnedAt = pinned.pinnedAt || null;
  const pinnedBy = pinned.pinnedBy || null;

  const isDeleted = Boolean(row.is_deleted || (row.reactions && typeof row.reactions === "object" && row.reactions.isDeleted));
  const deletedBy = row.deleted_by || (row.reactions && typeof row.reactions === "object" ? row.reactions.deletedBy : null) || null;
  const deletedAt = row.deleted_at || (row.reactions && typeof row.reactions === "object" ? row.reactions.deletedAt : null) || null;
  const deletedFor = row.deleted_for || (row.reactions && typeof row.reactions === "object" ? row.reactions.deletedFor : []) || [];

  return {
    id: row.id,
    threadId: row.channel_id || row.thread_id,
    channelId: row.channel_id || row.thread_id,
    threadType: (row.channel_id && row.channel_id.startsWith("dm_")) || row.thread_id ? "dm" : "channel",
    companyId: row.company_id,
    senderId: row.user_id || row.sender_id || row.senderId,
    senderName: row.user_name || row.sender_name || row.senderName || "User",
    senderAvatar: row.user_avatar || row.sender_avatar || row.senderAvatar || "",
    text: row.content || row.text || "",
    content: row.content || row.text || "",
    timestamp: row.created_at || row.timestamp,
    fileData: (row.file_url || row.fileUrl) ? {
      url: row.file_url || row.fileUrl,
      name: row.file_name || row.fileName || "Attachment",
      type: row.file_type || row.fileType || ""
    } : (row.fileData || null),
    reactions: row.reactions || {},
    isPinned,
    pinExpiresAt,
    pinDurationDays,
    pinnedAt,
    pinnedBy,
    isDeleted,
    deletedBy,
    deletedAt,
    deletedFor
  };
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteType = "everyone" } = req.body || {};
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userName = req.user?.name || "User";

    // 1. Check in messages table
    let msgRes = await query("SELECT * FROM messages WHERE id = $1", [id]);
    let tableName = "messages";

    // 2. If not in messages, check direct_messages table
    if (msgRes.rows.length === 0) {
      msgRes = await query("SELECT * FROM direct_messages WHERE id = $1", [id]);
      tableName = "direct_messages";
    }

    if (msgRes.rows.length === 0) {
      return res.status(404).json({ error: "Message not found." });
    }

    const msg = msgRes.rows[0];
    const senderId = msg.user_id || msg.sender_id;

    if (deleteType === "me") {
      const updateRes = await query(
        `UPDATE ${tableName} 
         SET deleted_for = array_append(COALESCE(deleted_for, ARRAY[]::TEXT[]), $1)
         WHERE id = $2
         RETURNING *`,
        [userId, id]
      );
      return res.json(formatMessageRow(updateRes.rows[0]));
    }

    // Delete for everyone
    const isSender = String(senderId) === String(userId);
    const isAdmin = userRole === "admin" || userRole === "superadmin";

    if (!isSender && !isAdmin) {
      return res.status(403).json({ error: "You are only authorized to delete your own messages." });
    }

    // Soft-delete: retain message content for Chat Monitor inspection
    let updateRes;
    if (tableName === "messages") {
      updateRes = await query(
        `UPDATE messages
         SET is_deleted = TRUE,
             deleted_at = CURRENT_TIMESTAMP,
             deleted_by = $1,
             reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), '{isDeleted}', 'true'::jsonb)
         WHERE id = $2
         RETURNING *`,
        [userName, id]
      );
    } else {
      updateRes = await query(
        `UPDATE direct_messages
         SET is_deleted = TRUE,
             deleted_at = CURRENT_TIMESTAMP,
             deleted_by = $1
         WHERE id = $2
         RETURNING *`,
        [userName, id]
      );
    }

    res.json(formatMessageRow(updateRes.rows[0]));
  } catch (err) {
    console.error("deleteMessage error:", err);
    res.status(500).json({ error: "Failed to delete message: " + err.message });
  }
};

// Messages
export const getMessages = async (req, res) => {
  try {
    const channelId = req.query.channelId || req.query.threadId;
    const { companyId } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    let sql = `
      SELECT m.*, u.name as real_user_name, u.avatar_url as real_user_avatar
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (channelId) {
      if (channelId.includes("_dm_")) {
        const parts = channelId.split("_dm_");
        if (parts.length === 2) {
          const revId = `${parts[1]}_dm_${parts[0]}`;
          params.push(channelId);
          params.push(revId);
          sql += ` AND (m.channel_id = $${params.length - 1} OR m.channel_id = $${params.length})`;
        } else {
          params.push(channelId);
          sql += ` AND m.channel_id = $${params.length}`;
        }
      } else {
        params.push(channelId);
        sql += ` AND m.channel_id = $${params.length}`;
      }
    }

    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND (m.company_id = $${params.length} OR m.company_id IS NULL)`;
    }

    sql += " ORDER BY m.created_at ASC LIMIT 1000";
    const result = await query(sql, params);
    res.json(result.rows.map(row => {
      const f = formatMessageRow(row);
      if (row.real_user_name) f.senderName = row.real_user_name;
      if (row.real_user_avatar && !f.senderAvatar) f.senderAvatar = row.real_user_avatar;
      return f;
    }));
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { channelId, threadId, content, attachments = [], replyToId = null, companyId } = req.body;
    const targetChannelId = channelId || threadId || "general";
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    const senderId = req.user?.id || req.body.senderId;
    let senderName = req.body.senderName || req.user?.name || "Team Member";
    let userAvatar = req.body.userAvatar || req.body.avatar || req.user?.avatarUrl || null;
    let targetCompanyId = (isSuperAdmin && companyId) ? companyId : (req.user?.companyId || companyId || "carrezza-global-solutions");

    if (!senderId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!senderName || senderName === "User") {
      const uRes = await query("SELECT name, avatar_url, company_id FROM users WHERE id = $1", [senderId]);
      if (uRes.rows.length > 0) {
        senderName = uRes.rows[0].name || "Team Member";
        userAvatar = userAvatar || uRes.rows[0].avatar_url || null;
        if (!targetCompanyId) targetCompanyId = uRes.rows[0].company_id;
      }
    }

    // Ensure sender exists in users table to prevent FK constraint failure
    await query(
      `INSERT INTO users (id, email, name, avatar_url, company_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [senderId, `${senderId}@system.local`, senderName, userAvatar, targetCompanyId || null]
    ).catch(() => {});

    // Ensure channel or thread exists in channels table
    await query(
      `INSERT INTO channels (id, company_id, name, description)
       VALUES ($1, $2, $3, 'Discussion Channel')
       ON CONFLICT (id) DO NOTHING`,
      [targetChannelId, targetCompanyId || null, targetChannelId]
    ).catch(() => {});

    const fileUrl = attachments[0]?.url || attachments[0]?.fileUrl || null;
    const fileName = attachments[0]?.name || attachments[0]?.fileName || null;
    const fileType = attachments[0]?.type || attachments[0]?.fileType || null;

    const id = "msg_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const result = await query(
      `INSERT INTO messages (id, channel_id, company_id, user_id, user_name, user_avatar, content, file_url, file_name, file_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, targetChannelId, targetCompanyId || null, senderId, senderName, userAvatar, content || "", fileUrl, fileName, fileType]
    );

    // If targetChannelId is a DM thread, update or insert into dm_threads
    if (targetChannelId && targetChannelId.includes("_dm_")) {
      const parts = targetChannelId.split("_dm_");
      await query(
        `INSERT INTO dm_threads (id, company_id, participants, last_message, last_message_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET last_message = EXCLUDED.last_message, last_message_at = CURRENT_TIMESTAMP`,
        [targetChannelId, targetCompanyId || null, parts, content || (fileName ? `Attachment: ${fileName}` : "Sent a file")]
      ).catch(() => {});
    }

    const formatted = formatMessageRow(result.rows[0]);
    formatted.senderName = senderName;

    // Real-time broadcast if socket is connected
    const io = req.app?.get("io");
    if (io) {
      if (targetCompanyId) io.to(`company_${targetCompanyId}`).emit("new_message", formatted);
      io.to(`channel_${targetChannelId}`).emit("new_message", formatted);
    }

    res.status(201).json(formatted);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "Failed to send message: " + (err.message || "") });
  }
};


export const pinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isPinned = true,
      pinDurationDays,
      pinnedDuration,
      pinnedUntil,
      pinExpiresAt,
      pinnedBy,
      pinnedAt
    } = req.body;

    const days = pinDurationDays || (pinnedDuration ? parseInt(pinnedDuration, 10) : null);
    const expiresAt = pinExpiresAt || pinnedUntil || (days ? new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() : null);

    const pinData = {
      isPinned: Boolean(isPinned),
      pinDurationDays: days,
      pinExpiresAt: expiresAt,
      pinnedUntil: expiresAt,
      pinnedBy: pinnedBy || req.user?.name || null,
      pinnedAt: pinnedAt || (isPinned ? new Date().toISOString() : null)
    };

    const result = await query(
      `UPDATE messages
       SET reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), '{pinned}', $1::jsonb)
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(pinData), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Message not found." });
    }

    res.json(formatMessageRow(result.rows[0]));
  } catch (err) {
    console.error("pinMessage error:", err);
    res.status(500).json({ error: "Failed to pin message." });
  }
};

// DM Threads
export const getDmThreads = async (req, res) => {
  try {
    const { userId, companyId } = req.query;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";
    // Security: Only superadmins can inspect another user's DM threads
    const targetUserId = (isSuperAdmin && userId) ? userId : req.user?.id;
    const targetCompanyId = (isSuperAdmin && companyId) ? companyId : req.user?.companyId;

    let sql = "SELECT * FROM dm_threads WHERE 1=1";
    const params = [];

    if (targetUserId) {
      params.push(targetUserId);
      sql += ` AND $${params.length} = ANY(participants)`;
    }
    if (targetCompanyId) {
      params.push(targetCompanyId);
      sql += ` AND company_id = $${params.length}`;
    }

    sql += " ORDER BY last_message_at DESC NULLS LAST LIMIT 200";
    const result = await query(sql, params);

    // Fetch user map for all participants to provide participantNames and participantDetails
    const allParticipantIds = new Set();
    result.rows.forEach(r => {
      (r.participants || []).forEach(p => allParticipantIds.add(p));
    });

    const userMap = {};
    if (allParticipantIds.size > 0) {
      const uRes = await query(
        "SELECT id, name, email, avatar_url, department, designation FROM users WHERE id = ANY($1)",
        [Array.from(allParticipantIds)]
      );
      uRes.rows.forEach(u => {
        userMap[u.id] = u;
      });
    }

    const threads = result.rows.map(row => {
      const participantNames = {};
      const participantAvatars = {};
      (row.participants || []).forEach(pId => {
        const u = userMap[pId];
        participantNames[pId] = u ? u.name : "Team Member";
        participantAvatars[pId] = u ? u.avatar_url : "";
      });

      return {
        ...row,
        participant_ids: row.participants,
        participantIds: row.participants,
        participantNames,
        participantAvatars
      };
    });

    res.json(threads);
  } catch (err) {
    console.error("getDmThreads error:", err);
    res.status(500).json({ error: "Failed to fetch DM threads." });
  }
};

export const createDmThread = async (req, res) => {
  try {
    const { participants = [], companyId } = req.body;
    const targetCompanyId = companyId || req.user?.companyId;

    if (!participants || participants.length < 2) {
      return res.status(400).json({ error: "At least 2 participants required." });
    }

    const id = "dm_" + [participants[0], participants[1]].sort().join("_");
    const result = await query(
      `INSERT INTO dm_threads (id, company_id, participants, last_message, last_message_at)
       VALUES ($1, $2, $3, null, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id
       RETURNING *`,
      [id, targetCompanyId, participants]
    );

    res.status(201).json({
      ...result.rows[0],
      participant_ids: result.rows[0].participants,
      participantIds: result.rows[0].participants
    });
  } catch (err) {
    console.error("createDmThread error:", err);
    res.status(500).json({ error: "Failed to create DM thread." });
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const callerId = req.user?.id;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";

    // Participant verification to prevent cross-user eavesdropping
    if (!isSuperAdmin) {
      const threadRes = await query("SELECT participants FROM dm_threads WHERE id = $1", [threadId]);
      if (threadRes.rows.length === 0) {
        return res.status(404).json({ error: "Conversation not found." });
      }
      const participants = threadRes.rows[0].participants || [];
      if (!participants.includes(callerId)) {
        return res.status(403).json({ error: "Access denied. You are not a participant in this conversation." });
      }
    }

    const result = await query(
      "SELECT *, sender_id as \"senderId\", created_at as timestamp FROM direct_messages WHERE thread_id = $1 ORDER BY created_at ASC LIMIT 1000",
      [threadId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getDirectMessages error:", err);
    res.status(500).json({ error: "Failed to fetch direct messages." });
  }
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { threadId, content, attachments = [] } = req.body;
    const senderId = req.user?.id;
    const isSuperAdmin = req.user?.role?.toLowerCase() === "superadmin";

    if (!senderId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    // Verify sender is participant in thread
    if (!isSuperAdmin) {
      const threadRes = await query("SELECT participants FROM dm_threads WHERE id = $1", [threadId]);
      if (threadRes.rows.length === 0) {
        return res.status(404).json({ error: "Conversation not found." });
      }
      const participants = threadRes.rows[0].participants || [];
      if (!participants.includes(senderId)) {
        return res.status(403).json({ error: "Access denied. You are not a participant in this conversation." });
      }
    }

    const fileUrl = attachments[0]?.url || attachments[0]?.fileUrl || null;

    const id = "dm_msg_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    const result = await query(
      `INSERT INTO direct_messages (id, thread_id, sender_id, content, file_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, threadId, senderId, content, fileUrl]
    );

    // Update dm_threads last_message
    await query(
      `UPDATE dm_threads
       SET last_message = $1, last_message_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [content, threadId]
    );

    const row = result.rows[0];
    res.status(201).json({
      ...row,
      senderId: row.sender_id,
      timestamp: row.created_at
    });
  } catch (err) {
    console.error("sendDirectMessage error:", err);
    res.status(500).json({ error: "Failed to send direct message." });
  }
};

export const updateReadReceipt = async (req, res) => {
  try {
    const { threadId, readAt } = req.body;
    const userId = req.user?.id || req.body.userId;
    if (!userId || !threadId) {
      return res.status(400).json({ error: "userId and threadId are required." });
    }

    const timestamp = readAt || new Date().toISOString();
    await query(
      `UPDATE users 
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{teamHubReadReceipts}',
         COALESCE(metadata->'teamHubReadReceipts', '{}'::jsonb) || jsonb_build_object($1::text, $2::text)
       )
       WHERE id = $3`,
      [threadId, timestamp, userId]
    );

    res.json({ success: true, threadId, readAt: timestamp });
  } catch (err) {
    console.error("updateReadReceipt error:", err);
    res.status(500).json({ error: "Failed to update read receipt." });
  }
};


