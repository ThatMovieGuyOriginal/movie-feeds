// lib/firebase-admin.js
const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

let firebaseApp;

/**
 * Initialize Firebase Admin with secure credential handling
 * This supports both direct environment variables and Secret Manager
 */
async function initializeFirebase() {
  if (admin.apps.length) {
    return admin.app();
  }

  // Check if we're using Google Cloud Secret Manager
  if (process.env.USE_SECRET_MANAGER === 'true') {
    try {
      const client = new SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({
        name: process.env.FIREBASE_SECRET_NAME,
      });
      
      const credentialJSON = JSON.parse(version.payload.data.toString('utf8'));
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credentialJSON),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      
    } catch (error) {
      console.error('Error loading Firebase credentials from Secret Manager:', error);
      throw error;
    }
  } else {
    // Use environment variables (works with Vercel)
    try {
      const credential = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };
    
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(credential),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    } catch (error) {
      console.error('Error initializing Firebase from environment variables:', error);
      throw error;
    }
  }
  
  return firebaseApp;
}

// Get Firestore DB with lazy initialization
async function getFirestore() {
  await initializeFirebase();
  return admin.firestore();
}

// Get Firebase Storage with lazy initialization
async function getStorage() {
  await initializeFirebase();
  return admin.storage();
}

// Get Firebase Authentication with lazy initialization
async function getAuth() {
  await initializeFirebase();
  return admin.auth();
}

/**
 * Premium subscription management utilities
 */
const subscriptionManager = {
  /**
   * Create a new subscription record
   * @param {string} email - User's email address
   * @param {string} planId - Premium plan identifier
   * @param {string} source - Subscription source (e.g., 'buymeacoffee', 'stripe')
   * @param {Object} metadata - Additional subscription metadata
   */
  async createSubscription(email, planId, source, metadata = {}) {
    const db = await getFirestore();
    const subscriptionId = `${source}_${Date.now()}`;
    
    const subscriptionData = {
      email: email.toLowerCase(),
      planId,
      source,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days
      ),
      token: generateUniqueToken(),
      metadata
    };
    
    // Set expiration based on plan type
    if (planId.includes('yearly')) {
      subscriptionData.expiresAt = admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      );
    }
    
    await db.collection('subscriptions').doc(subscriptionId).set(subscriptionData);
    
    // Also create/update the user record
    await db.collection('users').doc(email.toLowerCase()).set({
      email: email.toLowerCase(),
      hasActiveSubscription: true,
      latestSubscriptionId: subscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return {
      subscriptionId,
      token: subscriptionData.token,
      expiresAt: subscriptionData.expiresAt
    };
  },
  
  /**
   * Check if a user has an active subscription
   * @param {string} email - User's email address
   */
  async hasActiveSubscription(email) {
    if (!email) return false;
    
    const db = await getFirestore();
    const now = admin.firestore.Timestamp.now();
    
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('token', '==', token)
      .where('status', '==', 'active')
      .where('expiresAt', '>', now)
      .limit(1)
      .get();
      
    if (subscriptionsSnapshot.empty) {
      return null;
    }
    
    const subscription = subscriptionsSnapshot.docs[0].data();
    return {
      id: subscriptionsSnapshot.docs[0].id,
      ...subscription,
      createdAt: subscription.createdAt?.toDate() || null,
      expiresAt: subscription.expiresAt?.toDate() || null
    };
  },
  
  /**
   * Cancel or deactivate a subscription
   * @param {string} subscriptionId - ID of the subscription to cancel
   */
  async cancelSubscription(subscriptionId) {
    const db = await getFirestore();
    
    await db.collection('subscriptions').doc(subscriptionId).update({
      status: 'cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelledAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update the user record if this was their only subscription
    const subscription = await db.collection('subscriptions').doc(subscriptionId).get();
    const email = subscription.data().email;
    
    // Check if user has any other active subscriptions
    const activeSubscriptions = await db
      .collection('subscriptions')
      .where('email', '==', email)
      .where('status', '==', 'active')
      .where('expiresAt', '>', admin.firestore.Timestamp.now())
      .limit(1)
      .get();
      
    if (activeSubscriptions.empty) {
      await db.collection('users').doc(email).update({
        hasActiveSubscription: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return { success: true };
  }
};

/**
 * Analytics tracking utilities
 */
const analytics = {
  /**
   * Track RSS feed access event
   * @param {string} feedType - Type of feed accessed (free, premium, genre)
   * @param {Object} metadata - Additional tracking data
   */
  async trackFeedAccess(feedType, metadata = {}) {
    const db = await getFirestore();
    
    await db.collection('analytics').add({
      type: 'feed_access',
      feedType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata
    });
  },
  
  /**
   * Track movie selection event
   * @param {string} tmdbId - TMDB ID of the selected movie
   * @param {string} feedType - Type of feed where the movie appeared
   * @param {Object} metadata - Additional tracking data
   */
  async trackMovieSelection(tmdbId, feedType, metadata = {}) {
    const db = await getFirestore();
    
    await db.collection('analytics').add({
      type: 'movie_selection',
      tmdbId,
      feedType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata
    });
    
    // Also increment the movie's selection count in a separate collection
    const movieRef = db.collection('movie_stats').doc(tmdbId);
    await db.runTransaction(async (transaction) => {
      const movieDoc = await transaction.get(movieRef);
      
      if (movieDoc.exists) {
        transaction.update(movieRef, {
          selectionCount: admin.firestore.FieldValue.increment(1),
          lastSelected: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.set(movieRef, {
          tmdbId,
          selectionCount: 1,
          firstSelected: admin.firestore.FieldValue.serverTimestamp(),
          lastSelected: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
  },
  
  /**
   * Get movie recommendation stats
   * @param {number} limit - Number of top movies to retrieve
   */
  async getTopSelectedMovies(limit = 10) {
    const db = await getFirestore();
    
    const snapshot = await db
      .collection('movie_stats')
      .orderBy('selectionCount', 'desc')
      .limit(limit)
      .get();
      
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};

/**
 * Generate a unique token for subscription access
 * @returns {string} Unique token
 */
function generateUniqueToken() {
  return Buffer.from(
    admin.firestore.Timestamp.now().toMillis() + 
    Math.random().toString()
  ).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getStorage,
  getAuth,
  subscriptionManager,
  analytics
};();
    
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('email', '==', email.toLowerCase())
      .where('status', '==', 'active')
      .where('expiresAt', '>', now)
      .limit(1)
      .get();
      
    return !subscriptionsSnapshot.empty;
  },
  
  /**
   * Get all active subscriptions for a user
   * @param {string} email - User's email address
   */
  async getUserSubscriptions(email) {
    if (!email) return [];
    
    const db = await getFirestore();
    const subscriptionsSnapshot = await db
      .collection('subscriptions')
      .where('email', '==', email.toLowerCase())
      .orderBy('createdAt', 'desc')
      .get();
      
    return subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || null,
      expiresAt: doc.data().expiresAt?.toDate() || null
    }));
  },
  
  /**
   * Validate if a subscription token is valid
   * @param {string} token - Subscription token
   */
  async validateSubscriptionToken(token) {
    if (!token) return null;
    
    const db = await getFirestore();
    const now = admin.firestore.Timestamp.now
