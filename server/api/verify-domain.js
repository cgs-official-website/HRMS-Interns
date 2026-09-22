import dns from 'dns';
import util from 'util';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const resolveTxt = util.promisify(dns.resolveTxt);

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // Attempt to initialize using standard FIREBASE_ environment variables that Firebase Admin expects
    if (process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines so the key parses correctly
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      // Fallback: If no env vars, attempt to use default credentials
      initializeApp();
    }
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (authError) {
      console.error('Token verification failed:', authError);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { domainId, domainName } = req.body;

    if (!domainId || !domainName) {
      return res.status(400).json({ error: 'Missing domainId or domainName' });
    }

    // 1. Fetch the domain document from Firestore
    const db = getFirestore();
    const domainDocRef = db.collection('companyDomains').doc(domainId);
    
    let domainData = null;
    try {
      const domainDoc = await domainDocRef.get();
      if (domainDoc.exists) {
        domainData = domainDoc.data();
      }
    } catch (dbError) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("Firestore fetch error in dev (likely quota exceeded). Using mock data.", dbError.message);
        domainData = { status: 'PENDING', verificationToken: 'dummy' };
      } else {
        throw dbError;
      }
    }

    if (!domainData) {
      return res.status(404).json({ error: 'Domain record not found' });
    }

    if (domainData.status === 'VERIFIED') {
      return res.status(200).json({ success: true, message: 'Domain is already verified' });
    }

    const expectedToken = domainData.verificationToken;

    // 2. Perform DNS TXT Lookup
    let isVerified = false;
    
    // Bypass actual DNS check in local development environment
    if (process.env.NODE_ENV === 'development') {
      isVerified = true;
      console.log(`[DEV MODE] Bypassed DNS verification for ${domainName}`);
    } else {
      try {
        const records = await resolveTxt(domainName);
        
        // Node returns an array of arrays for TXT: [ ['record1part1', 'part2'], ['record2'] ]
        const flatRecords = records.map(recordArray => recordArray.join(''));
        
        if (flatRecords.includes(expectedToken)) {
          isVerified = true;
        }
      } catch (dnsError) {
        console.error(`DNS lookup failed for ${domainName}:`, dnsError);
        return res.status(400).json({ error: 'Failed to look up DNS records. Please ensure they are propagated.', details: dnsError.message });
      }
    }

    // 3. Update Firestore if verified
    if (isVerified) {
      try {
        await domainDocRef.update({
          status: 'VERIFIED',
          verifiedAt: FieldValue.serverTimestamp()
        });
      } catch (updateError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn("Firestore update error in dev (likely quota exceeded). Ignoring.", updateError.message);
        } else {
          throw updateError;
        }
      }
      return res.status(200).json({ success: true, message: 'Domain successfully verified!' });
    } else {
      return res.status(400).json({ error: 'Verification token not found in DNS records. Please wait for DNS propagation.' });
    }

  } catch (error) {
    console.error('Domain verification handler error:', error);
    
    // Handle Firestore Quota Exhaustion specifically
    if (error.message && error.message.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ error: 'Server is experiencing high traffic. Please try again later.' });
    }
    
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
