// --- UNIDADES Y DENOMINACIONES ---
window.UNITS = ["g", "ml", "und", "kg", "oz", "lt", "paquete"];

window.DENOMINATIONS = [
    { id: 'b100', value: 100000, label: '$100.000' },
    { id: 'b50', value: 50000, label: '$50.000' },
    { id: 'b20', value: 20000, label: '$20.000' },
    { id: 'b10', value: 10000, label: '$10.000' },
    { id: 'b5', value: 5000, label: '$5.000' },
    { id: 'b2', value: 2000, label: '$2.000' },
    { id: 'm1000', value: 1000, label: '$1.000' },
    { id: 'm500', value: 500, label: '$500' },
    { id: 'm200', value: 200, label: '$200' },
    { id: 'm100', value: 100, label: '$100' },
    { id: 'm50', value: 50, label: '$50' },
];

// --- DATOS INICIALES (SEMILLAS) ---
window.INITIAL_INVENTORY = [
    { id: 1, name: "Espresso Doble", price: 6000, category: "Calientes", stock: 500 },
    { id: 2, name: "Cappuccino", price: 8500, category: "Calientes", stock: 200 },
    { id: 18, name: "Café Mandré 340g", price: 35000, category: "Retail", stock: 50 },
];

window.INITIAL_COMBOS = [
    { id: 100, name: "Combo Mañana", price: 16000, category: "Combos", stock: 999, items: [2, 12] } 
];

window.INITIAL_USERS = [
    { id: 1, name: 'Admin', surname: 'Principal', username: 'admin', password: '123', email: 'admin@mandre.com' }
];

// --- FUNCIÓN DE SINCRONIZACIÓN ---
window.syncCollection = (collectionName, initialData, stateSetter) => {
    return window.db.collection(collectionName).onSnapshot(snap => {
        if (snap.empty && initialData) {
            const batch = window.db.batch();
            initialData.forEach(item => {
                const ref = window.db.collection(collectionName).doc(item.id.toString());
                batch.set(ref, item);
            });
            batch.commit();
        } else {
            stateSetter(snap.docs.map(doc => doc.data()));
        }
    });
};
