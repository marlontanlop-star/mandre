const firebaseConfig = {
    apiKey: "AIzaSyAutOqky0mpVmwDrqFsyZ0zRl_abrzgPvc",
    authDomain: "mandre-f9e43.firebaseapp.com",
    projectId: "mandre-f9e43",
    storageBucket: "mandre-f9e43.firebasestorage.app",
    messagingSenderId: "865403538422",
    appId: "1:865403538422:web:0ee2fb754343de9bc015d7"
};

// Inicializar Firebase
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}
window.db = window.firebase.firestore();

// Habilitar persistencia offline (Para que funcione si se cae el internet)
window.db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
    console.log("Error habilitando persistencia offline:", err);
});
