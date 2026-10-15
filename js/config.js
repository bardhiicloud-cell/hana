// HANA FREE SHOP — konfigurimi i publikimit (ngarkohet para js/firebase.js)
// 1) Firebase Console → Project settings → Your apps → Web app → kopjo vlerat poshtë.
//    (Këto çelësa janë publikë nga natyra; mbrojtja vjen nga firestore.rules + Cloud Functions.)
// 2) Pa apiKey, faqja punon vetëm në "demo lokal" (localhost) dhe porositë online janë të çaktivizuara.
window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

window.HANA_CONFIG = {
  functionsRegion: 'europe-west1',
  phone: '+383 48 588 886',
  whatsapp: '38348588886',
  gaId: '',        // p.sh. 'G-XXXXXXXXXX' — bosh = analytics i fikur
  fbPixelId: ''    // p.sh. '1234567890' — bosh = pixel i fikur
};
