const { useState, useEffect, useMemo, useRef } = React;
const { Search, Plus, Trash2, Edit3, X, Coffee, CreditCard, Banknote, User, LayoutDashboard, ShoppingCart, FileText, Tag, Box, ChevronUp, ChevronDown, Download, Phone, Lock, Share, LogOut, AlertTriangle, Bike, Shield, RefreshCw, CheckCircle, Activity, IconLeaf, db, syncCollection, INITIAL_INVENTORY, INITIAL_COMBOS, INITIAL_USERS, DENOMINATIONS, UNITS } = window;
const App = () => {
            // --- ESTADOS CONEXIÓN ---
            const [isOnline, setIsOnline] = useState(navigator.onLine);
            const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
            const [connectionLogs, setConnectionLogs] = useState([{status: navigator.onLine ? 'online' : 'offline', time: new Date().toLocaleTimeString()}]);
            // NUEVO: ESTADO PARA RADAR DE USUARIOS
            const [systemPresence, setSystemPresence] = useState([]);

            // --- ESTADOS GLOBALES ---
            const [view, setView] = useState('start'); 
            const [inventory, setInventory] = useState([]);
            const [combos, setCombos] = useState([]);
            const [tables, setTables] = useState([]);
            const [orders, setOrders] = useState([]); 
            const [expenses, setExpenses] = useState([]); 
            const [manualItemsCollection, setManualItemsCollection] = useState([]); 
            
            // Estados para Créditos, Abonos y Canjes de Caja
            const [credits, setCredits] = useState([]);
            const [abonos, setAbonos] = useState([]);
            const [cashAdjustments, setCashAdjustments] = useState([]);

            const [activeOrders, setActiveOrders] = useState({}); 
            const [users, setUsers] = useState([]);

            // Cierre de Caja & Shifts
            const [shifts, setShifts] = useState([]);
            const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
            const [cashCountDetails, setCashCountDetails] = useState({}); 
            const [closureResult, setClosureResult] = useState(null); 
            const closureReportRef = useRef(null);

            // Filtros Admin
            const [adminTab, setAdminTab] = useState('dashboard');
            const [transferFilter, setTransferFilter] = useState({ name: '', date: '' });
            const [expenseFilter, setExpenseFilter] = useState({ query: '', date: '' });
            const [creditFilter, setCreditFilter] = useState('');
            const [manualItemFilter, setManualItemFilter] = useState({ name: '', price: '', date: '' }); 
            const [adminViewTableOrder, setAdminViewTableOrder] = useState(null); // Visual modal para mesas

            // Login & User Data
            const [loginData, setLoginData] = useState({ identifier: '', password: '' });
            const [currentShiftEmployee, setCurrentShiftEmployee] = useState(null);
            const [sessionStartTime, setSessionStartTime] = useState(null); 
            
            // Edición & Formularios
            const [editItem, setEditItem] = useState(null); 
            const [newCombo, setNewCombo] = useState({ name: '', price: '', items: [] });
            const [newProductForm, setNewProductForm] = useState({ name: '', price: '', category: 'Calientes', icon: '☕' });
            const [newUserForm, setNewUserForm] = useState({ name: '', surname: '', emailPrefix: '', username: '', password: '' });

            // POS
            const [serviceSelected, setServiceSelected] = useState(false);
            const [orderType, setOrderType] = useState(''); 
            const [activeTableId, setActiveTableId] = useState(null);
            const [cart, setCart] = useState([]);
            const [selectedCategory, setSelectedCategory] = useState('Calientes');
            const [searchQuery, setSearchQuery] = useState(''); 
            const [customerName, setCustomerName] = useState('');
            const [showMobileCart, setShowMobileCart] = useState(false); 
            const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
            
            const [isOpenProductModalOpen, setIsOpenProductModalOpen] = useState(false);
            const [manualProduct, setManualProduct] = useState({ name: '', price: '' });

            const [paymentStep, setPaymentStep] = useState('method');
            const [cashGiven, setCashGiven] = useState('');
            const [adminPass, setAdminPass] = useState('');
            const [isProcessingPayment, setIsProcessingPayment] = useState(false);

            // Egresos POS
            const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
            const [expenseForm, setExpenseForm] = useState({ desc: '', amount: '' });

            // Abonos Modals
            const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
            const [activeCredit, setActiveCredit] = useState(null);
            const [abonoForm, setAbonoForm] = useState({ amount: '', method: 'efectivo', assignedUser: '' });

            // Canje Caja Modals
            const [cashAdjustForm, setCashAdjustForm] = useState({ employee: '', amount: '', type: 'add' });

            // Nomina / Pagos
            const [payrollForm, setPayrollForm] = useState({ 
                employee: '', hourlyRate: '', 
                hours: { Lunes: '', Martes: '', Miércoles: '', Jueves: '', Viernes: '', Sábado: '', Domingo: '' } 
            });
            const [showPayrollReceipt, setShowPayrollReceipt] = useState(false);
            const [payrollData, setPayrollData] = useState(null);
            const payrollReceiptRef = useRef(null);

            // --- AUTO LOGIN EFECTO ---
            useEffect(() => {
                if (users.length > 0 && view === 'start') {
                    const savedLogin = localStorage.getItem('mandre_login');
                    if (savedLogin) {
                        try {
                            const { identifier, password, time } = JSON.parse(savedLogin);
                            const user = users.find(u => (u.username === identifier || u.email === identifier) && u.password === password);
                            if (user) {
                                setCurrentShiftEmployee(`${user.name} ${user.surname}`);
                                setSessionStartTime(time || new Date().toLocaleTimeString());
                                setView('pos');
                            }
                        } catch(e) {}
                    }
                }
            }, [users, view]);

            // --- SINCRONIZACIÓN FIREBASE (REALTIME) ---
            useEffect(() => {
                const handleOnline = () => {
                    setIsOnline(true);
                    setConnectionLogs(prev => [{status: 'online', time: new Date().toLocaleTimeString()}, ...prev].slice(0, 50));
                };
                const handleOffline = () => {
                    setIsOnline(false);
                    setConnectionLogs(prev => [{status: 'offline', time: new Date().toLocaleTimeString()}, ...prev].slice(0, 50));
                };
                window.addEventListener('online', handleOnline);
                window.addEventListener('offline', handleOffline);

                const unsubConnection = db.collection('inventory').onSnapshot({ includeMetadataChanges: true }, (snap) => {
                    setIsFirebaseConnected(!snap.metadata.fromCache);
                });

                const unsubInv = syncCollection('inventory', INITIAL_INVENTORY, setInventory);
                const unsubComb = syncCollection('combos', INITIAL_COMBOS, setCombos);
                const unsubUsers = syncCollection('users', INITIAL_USERS, setUsers);
                
                // Lógica Robusta y Respaldo para Tablas (Asegura que siempre existan las requeridas)
                const unsubTables = db.collection('tables').onSnapshot(snap => {
                    let data = snap.docs.map(doc => doc.data());
                    
                    const requiredTables = [
                        { id: '1', type: 'mesa', status: 'libre', currentTotal: 0, label: 'Mesa 1' },
                        { id: '2', type: 'mesa', status: 'libre', currentTotal: 0, label: 'Mesa 2' },
                        { id: '3', type: 'mesa', status: 'libre', currentTotal: 0, label: 'Mesa 3' },
                        { id: '4', type: 'mesa', status: 'libre', currentTotal: 0, label: 'Mesa 4' },
                        { id: 'Cafetería', type: 'especial', icon: 'coffee', status: 'libre', currentTotal: 0, label: 'Cafetería' },
                        { id: 'Domicilio', type: 'especial', icon: 'bike', status: 'libre', currentTotal: 0, label: 'Domicilio' }
                    ];

                    const batch = db.batch();
                    let needsUpdate = false;

                    requiredTables.forEach(req => {
                        if (!data.find(t => t.id?.toString() === req.id)) {
                            batch.set(db.collection('tables').doc(req.id), req);
                            needsUpdate = true;
                            data.push(req); 
                        }
                    });

                    if (needsUpdate) {
                        batch.commit();
                    }
                    
                    setTables(data);
                });

                // Carga de Históricos y Nuevas Colecciones
                const unsubOrders = db.collection('orders').orderBy('id', 'desc').onSnapshot(snap => setOrders(snap.docs.map(d => d.data())));
                const unsubShifts = db.collection('shifts').orderBy('id', 'desc').onSnapshot(snap => setShifts(snap.docs.map(d => d.data())));
                const unsubExpenses = db.collection('expenses').orderBy('id', 'desc').onSnapshot(snap => setExpenses(snap.docs.map(d => d.data())));
                const unsubManualItems = db.collection('manualItems').orderBy('id', 'desc').onSnapshot(snap => setManualItemsCollection(snap.docs.map(d => d.data())));
                const unsubCredits = db.collection('creditos').orderBy('id', 'desc').onSnapshot(snap => setCredits(snap.docs.map(d => d.data())));
                const unsubAbonos = db.collection('abonos').orderBy('id', 'desc').onSnapshot(snap => setAbonos(snap.docs.map(d => d.data())));
                const unsubAdjustments = db.collection('cashAdjustments').orderBy('id', 'desc').onSnapshot(snap => setCashAdjustments(snap.docs.map(d => d.data())));
                
                // NUEVO: Escuchar el estado de conexión de otros usuarios para el Radar Admin
                const unsubSystemStatus = db.collection('system_status').onSnapshot(snap => setSystemPresence(snap.docs.map(d => d.data())));
                
                const unsubActiveOrders = db.collection('activeOrders').onSnapshot(snap => {
                    const data = {};
                    snap.docs.forEach(d => data[d.id] = d.data());
                    setActiveOrders(data);
                });

                const checkMidnightClosure = setInterval(() => {
                    const now = new Date();
                    if (now.getHours() === 0 && now.getMinutes() === 0) {
                        performClosure(true);
                    }
                }, 60000); 

                return () => {
                    window.removeEventListener('online', handleOnline);
                    window.removeEventListener('offline', handleOffline);
                    clearInterval(checkMidnightClosure);
                    unsubConnection();
                    unsubInv(); unsubComb(); unsubUsers(); unsubTables();
                    unsubOrders(); unsubShifts(); unsubActiveOrders(); unsubExpenses(); unsubManualItems();
                    unsubCredits(); unsubAbonos(); unsubAdjustments(); unsubSystemStatus();
                };
            }, []);

            // NUEVO: HEARTBEAT (Latido) PARA REPORTE DE CONEXIÓN EN ADMIN
            useEffect(() => {
                if (!currentShiftEmployee) return;
                
                const sendHeartbeat = () => {
                    if (navigator.onLine) {
                        db.collection('system_status').doc(currentShiftEmployee).set({
                            employee: currentShiftEmployee,
                            lastSeen: Date.now(),
                            isOnline: true
                        }, { merge: true }).catch(()=>{});
                    }
                };
                
                sendHeartbeat(); // Latido inicial
                const interval = setInterval(sendHeartbeat, 15000); // Latido cada 15 segundos
                
                return () => clearInterval(interval);
            }, [currentShiftEmployee, isOnline]);

            // --- COMPUTADOS ---
            const categories = ["Calientes", "Frías", "Fit-Pastry", "Bowls", "Combos", "Retail"];
            
            const displayInventory = useMemo(() => {
                return [...inventory, ...combos];
            }, [inventory, combos]);

            const calculateItemTotal = (item) => {
                return item.price * item.quantity;
            };

            const subtotal = useMemo(() => cart.reduce((acc, item) => acc + calculateItemTotal(item), 0), [cart]);
            const total = useMemo(() => subtotal, [subtotal]);
            
            const changeDue = useMemo(() => {
                const given = parseFloat(cashGiven) || 0;
                return given >= total ? given - total : 0;
            }, [cashGiven, total]);

            const filteredProducts = useMemo(() => {
                return displayInventory.filter(prod => {
                    if (searchQuery) {
                        return prod.name.toLowerCase().includes(searchQuery.toLowerCase());
                    }
                    return prod.category === selectedCategory;
                });
            }, [displayInventory, searchQuery, selectedCategory]);

            const renderMesas = tables.filter(t => ['1','2','3','4'].includes(t.id?.toString()));
            const renderEspeciales = tables.filter(t => ['Cafetería', 'Domicilio'].includes(t.id?.toString()));

            // --- METRICAS EN VIVO POR USUARIO ---
            const liveStats = useMemo(() => {
                const currentShiftOrders = orders.filter(o => !o.shiftId && o.method !== 'credito'); // Crédito no suma a caja
                const currentShiftAbonos = abonos.filter(a => !a.shiftId);
                const stats = { users: {} };
                
                // Sumar ventas normales
                currentShiftOrders.forEach(o => {
                    const emp = o.employee || 'Desconocido';
                    if (!stats.users[emp]) stats.users[emp] = { total: 0, efectivo: 0, nequi: 0 };
                    
                    stats.users[emp].total += o.total;
                    if (o.method === 'efectivo') stats.users[emp].efectivo += o.total;
                    if (o.method === 'transferencia') stats.users[emp].nequi += o.total;
                });

                // Sumar abonos recibidos
                currentShiftAbonos.forEach(a => {
                    const emp = a.employee || 'Desconocido';
                    if (!stats.users[emp]) stats.users[emp] = { total: 0, efectivo: 0, nequi: 0 };
                    
                    stats.users[emp].total += a.amount;
                    if(a.method === 'efectivo') stats.users[emp].efectivo += a.amount;
                    if(a.method === 'transferencia') stats.users[emp].nequi += a.amount;
                });

                return stats;
            }, [orders, abonos]);

            // --- FUNCIONES LOGIN Y EGRESOS ---
            const handleLogin = (e) => {
                e.preventDefault();
                const user = users.find(u => (u.username === loginData.identifier || u.email === loginData.identifier) && u.password === loginData.password);
                
                if (user) {
                    const time = new Date().toLocaleTimeString();
                    localStorage.setItem('mandre_login', JSON.stringify({ identifier: loginData.identifier, password: loginData.password, time }));
                    setCurrentShiftEmployee(`${user.name} ${user.surname}`);
                    setSessionStartTime(time);
                    setLoginData({ identifier: '', password: '' });
                    setView('pos');
                } else {
                    alert("Credenciales incorrectas");
                }
            };

            const handleLogout = () => {
                if(confirm("¿Seguro que desea cerrar sesión?")) {
                    localStorage.removeItem('mandre_login');
                    setCurrentShiftEmployee(null);
                    setSessionStartTime(null);
                    setView('start');
                }
            };

            const handleSaveExpense = async () => {
                if(!expenseForm.desc || !expenseForm.amount) return alert("Complete descripción y valor");
                const newEx = {
                    id: Date.now(),
                    desc: expenseForm.desc,
                    amount: parseFloat(expenseForm.amount),
                    date: new Date().toLocaleString(),
                    isoDate: new Date().toISOString().split('T')[0],
                    employee: currentShiftEmployee
                };
                await db.collection('expenses').doc(newEx.id.toString()).set(newEx);
                setExpenseForm({ desc: '', amount: '' });
                setIsExpenseModalOpen(false);
                alert(navigator.onLine ? "Egreso registrado exitosamente." : "Sin conexión. Egreso guardado localmente, se sincronizará cuando regrese internet.");
            };

            // --- FUNCIONES CRÉDITOS Y ABONOS (ADMIN) ---
            const handleAbono = async () => {
                const amount = parseFloat(abonoForm.amount);
                if(!amount || amount <= 0 || !abonoForm.assignedUser) return alert("Ingrese un monto válido y seleccione un usuario");
                if(amount > activeCredit.balance) return alert("El abono no puede superar la deuda actual.");

                setIsProcessingPayment(true);
                const batch = db.batch();

                const newBalance = activeCredit.balance - amount;
                
                batch.update(db.collection('creditos').doc(activeCredit.id.toString()), {
                    balance: newBalance,
                    status: newBalance <= 0 ? 'pagado' : 'pendiente'
                });

                const abono = { 
                    id: Date.now(), 
                    creditId: activeCredit.id, 
                    customer: activeCredit.customer, 
                    amount: amount, 
                    method: abonoForm.method, 
                    employee: abonoForm.assignedUser, 
                    date: new Date().toLocaleString(), 
                    isoDate: new Date().toISOString().split('T')[0] 
                };
                
                batch.set(db.collection('abonos').doc(abono.id.toString()), abono);

                try {
                    await batch.commit();
                    setIsAbonoModalOpen(false);
                    setAbonoForm({ amount: '', method: 'efectivo', assignedUser: '' });
                    setActiveCredit(null);
                    setIsProcessingPayment(false);
                    alert(navigator.onLine ? "Abono registrado con éxito y sumado a la caja del usuario." : "Abono guardado localmente, se sincronizará al haber internet.");
                } catch(e) {
                    alert("Error registrando abono.");
                    setIsProcessingPayment(false);
                }
            };

            const openAbonoModal = (credit) => {
                setActiveCredit(credit);
                setAbonoForm({ amount: credit.balance, method: 'efectivo', assignedUser: '' });
                setIsAbonoModalOpen(true);
            };

            // --- CANJEAR CAJA (ADMIN) ---
            const handleCashAdjust = async () => {
                const amount = parseFloat(cashAdjustForm.amount);
                if(!amount || !cashAdjustForm.employee) return alert("Seleccione un usuario y monto");

                const finalAmount = cashAdjustForm.type === 'add' ? amount : -Math.abs(amount);

                const adj = { 
                    id: Date.now(), 
                    employee: cashAdjustForm.employee, 
                    amount: finalAmount, 
                    type: cashAdjustForm.type, 
                    date: new Date().toLocaleString(),
                    isoDate: new Date().toISOString().split('T')[0] 
                };

                await db.collection('cashAdjustments').doc(adj.id.toString()).set(adj);
                setCashAdjustForm({ employee: '', amount: '', type: 'add' });
                alert(`Ajuste de ${finalAmount > 0 ? '+' : ''}${finalAmount} guardado internamente.`);
            };


            // --- FUNCIONES CIERRE DE CAJA ---
            const openClosureModal = () => {
                setCashCountDetails({});
                setClosureResult(null);
                setIsClosureModalOpen(true);
            };

            const handleCashCountChange = (id, qty) => {
                setCashCountDetails(prev => ({ ...prev, [id]: parseInt(qty) || 0 }));
            };

            const calculateCountedTotal = () => {
                return DENOMINATIONS.reduce((acc, curr) => {
                    return acc + (curr.value * (cashCountDetails[curr.id] || 0));
                }, 0);
            };

            const performClosure = async (isAuto = false) => {
                // Filtramos datos solo de este turno y excluimos pedidos a 'crédito'
                const currentShiftOrders = orders.filter(o => !o.shiftId && o.method !== 'credito');
                const currentShiftExpenses = expenses.filter(e => !e.shiftId);
                const currentShiftAbonos = abonos.filter(a => !a.shiftId);
                const currentShiftAdjustments = cashAdjustments.filter(a => !a.shiftId);
                
                // Si es automático y no hay nada que cerrar
                if (isAuto && currentShiftOrders.length === 0 && currentShiftAbonos.length === 0) return;

                // 1. Efectivo de Ventas
                let rawExpectedCash = currentShiftOrders.filter(o => o.method === 'efectivo').reduce((acc, o) => acc + o.total, 0);

                // 2. Nequi de Ventas
                let nequiTotal = currentShiftOrders.filter(o => o.method === 'transferencia').reduce((acc, o) => acc + o.total, 0);

                // 3. Sumar Abonos
                const abonosEfectivo = currentShiftAbonos.filter(a => a.method === 'efectivo').reduce((acc, a) => acc + a.amount, 0);
                const abonosNequi = currentShiftAbonos.filter(a => a.method === 'transferencia').reduce((acc, a) => acc + a.amount, 0);

                rawExpectedCash += abonosEfectivo;
                nequiTotal += abonosNequi;

                // 4. Restar Egresos (solo afectan efectivo físico esperado)
                const totalExpensesAmount = currentShiftExpenses.reduce((acc, e) => acc + e.amount, 0);
                let expectedCash = rawExpectedCash - totalExpensesAmount;

                // 5. Aplicar Ajustes Internos (Canjear Caja)
                const totalAdjustments = currentShiftAdjustments.reduce((acc, a) => acc + a.amount, 0);
                expectedCash += totalAdjustments;

                // Registro Items Manuales (solo para el recibo visual)
                const manualItems = [];
                currentShiftOrders.forEach(order => {
                    order.items.forEach(item => {
                        if (item.id.toString().startsWith('manual_')) {
                            manualItems.push({ date: order.date, name: item.name, price: item.price, qty: item.quantity });
                        }
                    });
                });

                const countedCash = isAuto ? 0 : calculateCountedTotal();
                const diff = countedCash - expectedCash;
                const employeeName = isAuto ? "Automático Sistema" : (currentShiftEmployee || "Admin");
                
                // Total Ventas (Día)
                const totalVentas = (rawExpectedCash - abonosEfectivo) + (nequiTotal - abonosNequi); 

                const result = {
                    id: Date.now(),
                    date: new Date().toLocaleString(),
                    employee: employeeName,
                    totalVentas: totalVentas,
                    expectedCash: expectedCash,
                    countedCash: countedCash,
                    nequiTotal: nequiTotal,
                    abonosEfectivo: abonosEfectivo,
                    abonosNequi: abonosNequi,
                    diff: diff,
                    ordersCount: currentShiftOrders.length,
                    manualItems: manualItems,
                    expensesList: currentShiftExpenses,
                    totalExpensesAmount: totalExpensesAmount,
                    totalAdjustments: totalAdjustments, 
                    isAuto: isAuto
                };

                const batch = db.batch();
                batch.set(db.collection('shifts').doc(result.id.toString()), result);
                
                currentShiftOrders.forEach(o => batch.update(db.collection('orders').doc(o.id.toString()), { shiftId: result.id }));
                currentShiftExpenses.forEach(e => batch.update(db.collection('expenses').doc(e.id.toString()), { shiftId: result.id }));
                currentShiftAbonos.forEach(a => batch.update(db.collection('abonos').doc(a.id.toString()), { shiftId: result.id }));
                currentShiftAdjustments.forEach(a => batch.update(db.collection('cashAdjustments').doc(a.id.toString()), { shiftId: result.id }));

                // NUEVO: Reset de TODAS las mesas en Firebase y activeOrders
                tables.forEach(t => {
                    batch.update(db.collection('tables').doc(t.id.toString()), { status: 'libre', currentTotal: 0 });
                    batch.delete(db.collection('activeOrders').doc(t.id.toString()));
                });

                await batch.commit();
                if(!isAuto) setClosureResult(result);
            };

            const deleteShift = async (id) => {
                if(confirm("¿Estás seguro de eliminar este reporte de cierre permanentemente?")) {
                    await db.collection('shifts').doc(id.toString()).delete();
                }
            };

            const shareClosureReport = async () => {
                if (closureReportRef.current) {
                    try {
                        const canvas = await html2canvas(closureReportRef.current, { scale: 2, backgroundColor: '#ffffff' });
                        canvas.toBlob(async (blob) => {
                            const file = new File([blob], `Cierre_${Date.now()}.png`, { type: 'image/png' });
                            
                            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    files: [file],
                                    title: 'Reporte Cierre MANDRÉ',
                                    text: `Cierre de caja realizado por ${currentShiftEmployee}`
                                });
                            } else {
                                const link = document.createElement('a');
                                link.download = `Cierre_${Date.now()}.png`;
                                link.href = canvas.toDataURL();
                                link.click();
                                alert("Imagen descargada. Compártela manualmente desde tu galería.");
                            }
                        });
                    } catch (err) {
                        console.error("Error compartiendo:", err);
                        alert("No se pudo compartir. Descargando imagen...");
                    }
                }
            };

            // --- ADMIN: PAGO A EMPLEADOS (NÓMINA) ---
            const handleGeneratePayroll = () => {
                const rate = parseFloat(payrollForm.hourlyRate);
                if(!payrollForm.employee || !rate) {
                    return alert("Por favor complete empleado y valor por hora.");
                }

                let totalHours = 0;
                Object.values(payrollForm.hours).forEach(h => {
                    if (h && !isNaN(parseFloat(h))) {
                        totalHours += parseFloat(h);
                    }
                });

                if (totalHours <= 0) {
                    return alert("Por favor ingrese horas trabajadas en al menos un día.");
                }

                const total = rate * totalHours;
                
                setPayrollData({
                    id: Date.now(),
                    employee: payrollForm.employee,
                    rate,
                    hoursBreakdown: {...payrollForm.hours},
                    totalHours: totalHours,
                    totalPayment: total,
                    date: new Date().toLocaleDateString()
                });
                setShowPayrollReceipt(true);
            };

            const sharePayrollReceipt = async () => {
                if (payrollReceiptRef.current) {
                    try {
                        const canvas = await html2canvas(payrollReceiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
                        canvas.toBlob(async (blob) => {
                            const file = new File([blob], `Pago_${payrollData.employee}_${Date.now()}.png`, { type: 'image/png' });
                            
                            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                await navigator.share({
                                    files: [file],
                                    title: `Comprobante de Pago - ${payrollData.employee}`,
                                    text: `Adjunto comprobante de pago de MANDRÉ para ${payrollData.employee}`
                                });
                            } else {
                                const link = document.createElement('a');
                                link.download = `Pago_${payrollData.employee}_${Date.now()}.png`;
                                link.href = canvas.toDataURL();
                                link.click();
                                alert("Comprobante descargado.");
                            }
                        });
                    } catch (err) {
                        console.error("Error compartiendo comprobante:", err);
                    }
                }
            };

            // --- ADMIN: HARD RESET ---
            const deleteCollection = async (collectionPath) => {
                const query = await db.collection(collectionPath).get();
                const batch = db.batch();
                query.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            };

            const performHardReset = async () => {
                const word = prompt("¡ADVERTENCIA! Esto borrará todas las ventas, egresos, cierres, créditos, abonos, items manuales y mesas activas.\n\nEscriba 'BORRAR' en mayúsculas para confirmar:");
                if (word === 'BORRAR') {
                    try {
                        await Promise.all([
                            deleteCollection('orders'),
                            deleteCollection('shifts'),
                            deleteCollection('expenses'),
                            deleteCollection('manualItems'),
                            deleteCollection('activeOrders'),
                            deleteCollection('creditos'),
                            deleteCollection('abonos'),
                            deleteCollection('cashAdjustments')
                        ]);
                        
                        const batch = db.batch();
                        tables.forEach(t => {
                            batch.update(db.collection('tables').doc(t.id.toString()), { status: 'libre', currentTotal: 0 });
                        });
                        await batch.commit();
                        
                        alert("Sistema Reiniciado a 0. Listo para Producción.");
                    } catch(e) {
                        alert("Hubo un error borrando. Verifique conexión.");
                    }
                } else if (word !== null) {
                    alert("Palabra incorrecta. Operación cancelada.");
                }
            };

            // --- GESTION USUARIOS ADMIN ---
            const createNewUser = async () => {
                const { name, surname, emailPrefix, username, password } = newUserForm;
                if(!name || !surname || !emailPrefix || !username || !password) return alert("Complete todos los campos del usuario");
                
                const newUser = {
                    id: Date.now(),
                    name,
                    surname,
                    email: `${emailPrefix}@mandre.com`,
                    username,
                    password
                };
                
                await db.collection('users').doc(newUser.id.toString()).set(newUser);
                setNewUserForm({ name: '', surname: '', emailPrefix: '', username: '', password: '' });
                alert("Usuario Creado Exitosamente en Firebase");
            };

            // --- GESTION PRODUCTOS ADMIN ---
            const createNewProduct = async () => {
                if(!newProductForm.name || !newProductForm.price) return alert("Complete nombre y precio");
                const newItem = {
                    id: Date.now(),
                    name: newProductForm.name,
                    price: parseFloat(newProductForm.price),
                    category: newProductForm.category,
                    stock: 999, 
                    icon: newProductForm.icon
                };
                await db.collection('inventory').doc(newItem.id.toString()).set(newItem);
                setNewProductForm({ name: '', price: '', category: 'Calientes', icon: '☕' });
                alert("Producto Creado Exitosamente en Firebase");
            };

            const deleteInventoryItem = async (type, id) => {
                if(!confirm("¿Seguro que desea eliminar este ítem de Firebase?")) return;
                const col = 'inventory';
                await db.collection(col).doc(id.toString()).delete();
            };

            const startEditingItem = (type, item) => {
                setEditItem({ type, data: {...item} });
            };

            const saveEditedItem = async () => {
                if(!editItem) return;
                const { type, data } = editItem;
                const col = 'inventory';
                
                await db.collection(col).doc(data.id.toString()).update(data);
                setEditItem(null);
            };

            // LOGICA COMBOS
            const handleCreateCombo = async () => {
                if (!newCombo.name || !newCombo.price || newCombo.items.length === 0) return alert("Faltan datos");
                const combo = {
                    id: Date.now(),
                    name: newCombo.name,
                    price: parseFloat(newCombo.price),
                    category: 'Combos',
                    stock: 999, 
                    items: newCombo.items
                };
                await db.collection('combos').doc(combo.id.toString()).set(combo);
                setNewCombo({ name: '', price: '', items: [] });
                alert("Combo Guardado");
            };

            const toggleItemInCombo = (id) => {
                if (newCombo.items.includes(id)) {
                    setNewCombo({...newCombo, items: newCombo.items.filter(i => i !== id)});
                } else {
                    setNewCombo({...newCombo, items: [...newCombo.items, id]});
                }
            };

            // --- FUNCIONES POS ---
            const selectTable = (rawId) => {
                const id = rawId?.toString();
                const table = tables.find(t => t.id?.toString() === id);
                if (!table) return;

                if (table.status === 'ocupada') {
                    if (activeOrders[id]) {
                        setCart(activeOrders[id].items || []);
                        setCustomerName(activeOrders[id].customer || '');
                    }
                } else {
                    setCart([]);
                    setCustomerName('');
                }
                setActiveTableId(id);
                setOrderType(table.type === 'mesa' ? 'mesa' : id.toLowerCase());
                setServiceSelected(true);
            };

            const exitServiceMode = () => {
                setServiceSelected(false);
                setCart([]);
                setActiveTableId(null);
                setOrderType('');
                setShowMobileCart(false);
            };

            const addToCartDirect = (product) => {
                const newItem = {
                    ...product,
                    cartId: Date.now(),
                    quantity: 1
                };
                setCart([...cart, newItem]);
            };

            const addManualProduct = () => {
                if(!manualProduct.name || !manualProduct.price) return alert("Ingrese nombre y precio");
                const newItem = {
                    id: 'manual_' + Date.now(),
                    name: manualProduct.name,
                    price: parseFloat(manualProduct.price),
                    category: 'Otros',
                    quantity: 1,
                    cartId: Date.now()
                };
                setCart([...cart, newItem]);
                setIsOpenProductModalOpen(false);
                setManualProduct({ name: '', price: '' });
            };

            const removeFromCart = (cartId) => {
                setCart(cart.filter(item => item.cartId !== cartId));
            };

            const sendToKitchen = async () => {
                if (cart.length === 0) return alert("Carrito vacío");

                if (activeTableId) {
                    const tableIdStr = activeTableId.toString();
                    const batch = db.batch();
                    
                    // Aseguramos de que se escriba forzadamente usando merge
                    batch.set(db.collection('tables').doc(tableIdStr), { status: 'ocupada', currentTotal: total }, { merge: true });
                    batch.set(db.collection('activeOrders').doc(tableIdStr), {
                        items: cart, customer: customerName || tableIdStr, subtotal, total
                    });

                    // Gracias a db.enablePersistence(), el commit() funcionará y guardará offline
                    // Si no lo usáramos, se colgaría esperando conexión.
                    try {
                        await batch.commit();
                        alert(navigator.onLine ? `Cuenta de ${tableIdStr} Actualizada/Guardada.` : `Sin internet. Cuenta de ${tableIdStr} guardada localmente.`);
                        setServiceSelected(false);
                        setShowMobileCart(false);
                    } catch(e) {
                        alert("Error guardando cuenta localmente.");
                    }
                } else {
                    openPaymentModal();
                }
            };

            const openPaymentModal = () => {
                setPaymentStep('method');
                setCashGiven('');
                if(!activeTableId) setCustomerName(''); 
                setIsProcessingPayment(false); 
                setIsPaymentModalOpen(true);
            };

            const handleFinalizePayment = async (method, detail) => {
                if (isProcessingPayment) return;

                if ((method === 'transferencia' || method === 'credito') && !customerName.trim()) {
                    alert(`Para pagos por ${detail}, el Nombre del Cliente es obligatorio.`);
                    return;
                }

                if (navigator.vibrate) {
                    navigator.vibrate(100);
                }

                setIsProcessingPayment(true); 

                const finalCustomerName = customerName.trim() || "Cliente General";
                const batch = db.batch();
                const currentDate = new Date();
                
                // Deducir Inventario y Guardar Manuales en Colección
                cart.forEach(item => {
                    if (item.id.toString().startsWith('manual_')) {
                        const manualId = item.cartId.toString() + Math.floor(Math.random()*1000);
                        batch.set(db.collection('manualItems').doc(manualId), {
                            id: manualId, name: item.name, price: item.price, qty: item.quantity,
                            date: currentDate.toLocaleString(), isoDate: currentDate.toISOString().split('T')[0],
                            employee: currentShiftEmployee
                        });
                    }
                    else if (item.category === 'Combos') {
                        item.items.forEach(subItemId => {
                             const idx = inventory.findIndex(p => p.id === subItemId);
                             if(idx !== -1) {
                                 batch.update(db.collection('inventory').doc(subItemId.toString()), { stock: inventory[idx].stock - item.quantity });
                             }
                        });
                    } else if (item.category !== 'Otros') {
                        const idx = inventory.findIndex(p => p.id === item.id);
                        if(idx !== -1) {
                            batch.update(db.collection('inventory').doc(item.id.toString()), { stock: inventory[idx].stock - item.quantity });
                        }
                    }
                });

                // Si es Crédito, guardar en tabla 'creditos'. 
                if (method === 'credito') {
                    const newCredit = { 
                        id: Date.now(), customer: finalCustomerName, total, balance: total, items: cart, 
                        date: currentDate.toLocaleString(), isoDate: currentDate.toISOString().split('T')[0], 
                        employee: currentShiftEmployee, status: 'pendiente' 
                    };
                    batch.set(db.collection('creditos').doc(newCredit.id.toString()), newCredit);
                }

                // Registrar Orden (Se registra incluso si es crédito para control de inventario/historial)
                const newOrder = { 
                    id: Date.now(), date: currentDate.toLocaleTimeString(), fullDate: currentDate.toLocaleDateString(),
                    isoDate: currentDate.toISOString().split('T')[0], total, method, detail, 
                    customer: finalCustomerName, items: cart, employee: currentShiftEmployee 
                };
                batch.set(db.collection('orders').doc(newOrder.id.toString()), newOrder);
                
                // Limpiar Mesas y Opciones Especiales
                if(activeTableId) {
                    const tableIdStr = activeTableId.toString();
                    batch.update(db.collection('tables').doc(tableIdStr), { status: 'libre', currentTotal: 0 });
                    batch.delete(db.collection('activeOrders').doc(tableIdStr));
                }

                try {
                    await batch.commit();
                    setCart([]);
                    setCustomerName('');
                    setIsPaymentModalOpen(false);
                    setServiceSelected(false);
                    setShowMobileCart(false);
                    setCashGiven('');
                    setIsProcessingPayment(false);
                    alert(navigator.onLine ? `¡Venta ${method === 'credito' ? 'a Crédito' : ''} Sincronizada y Cerrada con Éxito!` : "¡Venta Guardada Offline! Se sincronizará automáticamente cuando vuelva el internet.");
                } catch (error) {
                    console.error("Error en transacción:", error);
                    alert("Error de guardado local o conexión. Intente nuevamente.");
                    setIsProcessingPayment(false); 
                }
            };

            return (
                <div className="h-[100dvh] flex flex-col bg-mandre-bone font-sans text-mandre-dark overflow-hidden">
                    
                    {/* TOP HEADER COMPARTIDO (MÁS LIMPIO) */}
                    <header className="bg-white px-4 py-3 flex justify-between items-center shadow-sm z-20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center bg-mandre-coffee rounded-full shadow-lg shrink-0"><IconLeaf /></div>
                            <div className="truncate">
                                <h1 className="text-lg md:text-xl font-bold tracking-widest text-mandre-coffee">MANDRÉ</h1>
                                <p className="text-[10px] text-gray-400 font-bold uppercase truncate flex items-center gap-1">
                                    {currentShiftEmployee || 'Invitado'}
                                    {/* Indicador Global de Internet Visual */}
                                    <span className={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                             {serviceSelected && (
                                <button onClick={exitServiceMode} className="text-xs border border-red-200 text-red-500 p-2 rounded-full hover:bg-red-50 transition active:scale-95 flex items-center justify-center" title="Atrás">
                                    <LogOut size={18}/>
                                </button>
                            )}
                            {view === 'pos' && !serviceSelected && (
                                <>
                                    <button onClick={() => setIsExpenseModalOpen(true)} className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 rounded-full text-red-600 transition flex items-center justify-center" title="Registrar Egreso">
                                        <Banknote size={18}/>
                                    </button>
                                    <button onClick={openClosureModal} className="p-2 hover:bg-gray-100 rounded-full text-mandre-dark transition flex items-center justify-center" title="Cerrar Caja">
                                        <Lock size={20}/>
                                    </button>
                                    <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full text-red-400 transition flex items-center justify-center" title="Cerrar Sesión">
                                        <LogOut size={20}/>
                                    </button>
                                </>
                            )}
                            <button onClick={() => view === 'admin_panel' ? setView('pos') : setView('admin_login')} className="p-2 hover:bg-gray-100 rounded-full text-mandre-coffee transition ml-1 border-l pl-3 flex items-center justify-center">
                                {view === 'admin_panel' ? <LogOut size={20} /> : <LayoutDashboard size={20} />}
                        </div>
                    </header>

                    {/* VISTA POS */}
                    {view === 'pos' && (
                        <div className="flex-1 flex overflow-hidden relative">
                            {!serviceSelected ? (
                                <div className="absolute inset-0 z-30 bg-mandre-bone flex flex-col items-center justify-start md:justify-center p-4 pt-10 md:pt-4 animate-fadeIn overflow-y-auto">
                                    <div className="max-w-4xl w-full bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-white/50">
                                        <h2 className="text-xl md:text-2xl font-light text-mandre-coffee mb-6 text-center">Seleccione Área de Servicio</h2>
                                        
                                        <div className="flex gap-2 justify-center text-[10px] font-bold uppercase text-gray-400 mb-6">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-200"></div> Libre</span>
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-mandre-orange"></div> Ocupada</span>
                                        </div>

                                        {/* SOLO 4 MESAS */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 border-b border-gray-100 pb-8">
                                            {renderMesas.map(table => (
                                                <button key={table.id} onClick={() => selectTable(table.id)} className={`relative aspect-square rounded-3xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 group ${table.status === 'libre' ? 'bg-gray-50 border-2 border-transparent text-gray-400 hover:border-mandre-sage/30 hover:text-mandre-sage shadow-sm' : 'bg-mandre-orange text-white shadow-lg shadow-orange-200 scale-105'}`}>
                                                    <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center border-2 ${table.status === 'libre' ? 'border-gray-200 group-hover:border-mandre-sage' : 'border-white bg-white/20'}`}><span className="font-bold text-xl">{table.id}</span></div>
                                                    <span className="text-xs font-bold uppercase tracking-widest">{table.label || `Mesa ${table.id}`}</span>
                                                    {table.status === 'ocupada' && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">${table.currentTotal.toLocaleString()}</span>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* CAFETERIA Y DOMICILIO - ANIMADOS */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {renderEspeciales.map(table => (
                                                <button key={table.id} onClick={() => selectTable(table.id)} className={`relative p-5 rounded-3xl flex items-center justify-between transition-all duration-300 active:scale-95 group ${table.status === 'libre' ? 'bg-mandre-sage/10 border-2 border-mandre-sage/30 text-mandre-sage hover:bg-mandre-sage/20 shadow-[0_0_15px_rgba(143,188,143,0.3)] animate-pulse-slow' : 'bg-mandre-orange text-white shadow-lg shadow-orange-200 scale-105'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${table.status === 'libre' ? 'border-mandre-sage/50 bg-white text-mandre-sage animate-bounce-slight' : 'border-white bg-white/20 text-white'}`}>
                                                            {table.id === 'Cafetería' || table.icon === 'coffee' ? <Coffee size={20}/> : <Bike size={20}/>}
                                                        </div>
                                                        <div className="text-left">
                                                            <span className="text-sm font-bold uppercase tracking-widest block">{table.label || table.id}</span>
                                                            <span className="text-[10px] uppercase font-bold opacity-70">{table.status}</span>
                                                        </div>
                                                    </div>
                                                    {table.status === 'ocupada' && <span className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-full shadow-sm font-bold">${table.currentTotal.toLocaleString()}</span>}
                                                    {table.status === 'libre' && <span className="opacity-50 font-bold tracking-widest text-xs">ABRIR →</span>}
                                                </button>
                                            ))}
                                        </div>

                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                                        <div className="px-4 py-3 flex flex-col md:flex-row gap-3 border-b shrink-0 items-start md:items-center bg-white z-10 relative shadow-sm">
                                            <div className="w-full md:w-auto flex gap-2">
                                                <div className="relative flex-1 md:w-64">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Buscar producto..." 
                                                        className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-full text-sm outline-none focus:border-mandre-sage focus:bg-white border-2 transition-all"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                                <button onClick={() => setIsOpenProductModalOpen(true)} className="px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-mandre-sage/10 text-mandre-sage border border-mandre-sage/30 flex items-center gap-1 active:scale-95 transition">
                                                    <Plus size={14}/> Manual
                                                </button>
                                            </div>
                                            
                                            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full pb-1 touch-pan-x">
                                                {categories.map(cat => (
                                                    <button 
                                                        key={cat} 
                                                        onClick={() => { setSelectedCategory(cat); setSearchQuery(''); }} 
                                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${selectedCategory === cat && !searchQuery ? 'bg-mandre-coffee text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 pb-28 md:pb-4 relative z-0">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {filteredProducts.map(prod => (
                                                    <div key={prod.id} onClick={() => addToCartDirect(prod)} className="bg-white p-4 rounded-2xl shadow-sm active:scale-95 transition cursor-pointer flex flex-col items-center text-center border border-transparent hover:border-mandre-sage/30">
                                                        <div className="w-16 h-16 bg-mandre-bone rounded-full mb-3 flex items-center justify-center text-2xl">
                                                            {prod.icon || (prod.category === 'Combos' ? '🛍️' : '☕')}
                                                        </div>
                                                        <h3 className="font-bold text-xs text-mandre-coffee mb-1 h-8 flex items-center justify-center">{prod.name}</h3>
                                                        <p className="text-mandre-sage font-bold text-xs">${prod.price.toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {filteredProducts.length === 0 && (
                                                <div className="text-center py-10 text-gray-400 font-bold">
                                                    No se encontraron productos {searchQuery ? `para "${searchQuery}"` : ''}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* CARRITO */}
                                    <div className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 flex flex-col md:relative md:translate-x-0 md:w-96 md:border-l md:border-gray-100 md:shadow-2xl ${showMobileCart ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                                        <div className="md:hidden p-4 flex justify-between items-center border-b bg-gray-50">
                                            <h2 className="font-bold text-mandre-coffee">Detalle de la Orden</h2>
                                            <button onClick={() => setShowMobileCart(false)} className="p-2 bg-white rounded-full shadow-sm"><ChevronDown size={20}/></button>
                                        </div>
                                        <div className="p-6 bg-mandre-coffee text-white">
                                            <h2 className="font-bold tracking-widest text-xs opacity-60">CUENTA ACTIVA</h2>
                                            <p className="text-xl font-bold uppercase">{['1','2','3','4'].includes(activeTableId?.toString()) ? `MESA ${activeTableId}` : activeTableId}</p>
                                        </div>
                                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                            {cart.map(item => (
                                                <div key={item.cartId} className="flex justify-between items-center border-b pb-2 group">
                                                    <div>
                                                        <p className="font-bold text-sm">{item.name}</p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-3">
                                                        <p className="font-bold text-sm">${calculateItemTotal(item).toLocaleString()}</p>
                                                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 text-xs hover:text-red-600 bg-red-50 p-1.5 rounded-full"><Trash2 size={14}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {cart.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Agregue productos a la comanda</p>}
                                        </div>
                                        <div className="p-6 bg-gray-50 border-t">
                                            <div className="flex justify-between text-xl font-bold mb-4"><span>Total</span><span>${total.toLocaleString()}</span></div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={sendToKitchen} className="bg-gray-200 text-gray-700 py-3 rounded-lg font-bold text-xs hover:bg-gray-300 transition active:scale-95 shadow-sm">GUARDAR (PAGAR LUEGO)</button>
                                                <button onClick={openPaymentModal} className="bg-mandre-coffee text-white py-3 rounded-lg font-bold text-xs hover:bg-gray-800 transition shadow-lg active:scale-95">COBRAR AHORA</button>
                                            </div>
                                        </div>
                                    </div>

                                    {!showMobileCart && (
                                        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 flex justify-between items-center pb-6">
                                            <div onClick={() => setShowMobileCart(true)} className="flex flex-col"><p className="text-xs text-gray-500 font-medium">{cart.reduce((a,b)=>a+b.quantity,0)} Items</p><div className="flex items-center gap-2"><p className="font-bold text-mandre-coffee text-xl">${total.toLocaleString()}</p><ChevronUp size={16} className="text-gray-400"/></div></div>
                                            <button onClick={() => setShowMobileCart(true)} className="bg-mandre-coffee text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition">VER ORDEN <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{cart.length}</span></button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* VISTA ADMIN PANEL */}
                    {view === 'admin_panel' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                            {/* Pestañas Admin */}
                            <div className="bg-white border-b px-4 py-4 flex gap-3 overflow-x-auto scrollbar-hide shrink-0 touch-pan-x">
                                {[{k:'dashboard', l:'Métricas VIVO'}, {k:'status', l:'Estado Sistema'}, {k:'payroll', l:'Pagos Equipo'}, {k:'credits', l:'Créditos/Abonos'}, {k:'cash_adjust', l:'Canje Caja'}, {k:'transfers', l:'Transferencias'}, {k:'expenses', l:'Egresos'}, {k:'products', l:'Menú'}, {k:'users', l:'Equipo'}, {k:'combos', l:'Combos'}, {k:'manual_items', l:'Items Manuales'}, {k:'shifts', l:'Cierres'}].map(t => (
                                    <button key={t.k} onClick={() => setAdminTab(t.k)} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition whitespace-nowrap shrink-0 shadow-sm border border-transparent ${adminTab === t.k ? 'bg-mandre-sage text-white' : 'bg-gray-50 text-gray-500 hover:border-gray-200'}`}>{t.l}</button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-12 relative">
                                {adminTab === 'status' && (
                                    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4 border-b pb-2">Estado Actual del Sistema</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Usuario en Turno</p>
                                                    <p className="font-bold text-lg text-mandre-dark">{currentShiftEmployee || 'Sin Iniciar Sesión'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Hora de Ingreso</p>
                                                    <p className="font-bold text-lg text-mandre-dark">{sessionStartTime || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex flex-col gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-gray-600">Red (Internet)</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold">{isOnline ? 'Online' : 'Offline'}</span>
                                                        <div className={`w-3 h-3 rounded-full shadow-sm ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-gray-600">Conexión a Firebase</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold">{isFirebaseConnected ? 'Sincronizado' : 'Sin Nube (Modo Local)'}</span>
                                                        <div className={`w-3 h-3 rounded-full shadow-sm ${isFirebaseConnected ? 'bg-blue-500' : 'bg-orange-500 animate-pulse'}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* NUEVO: RADAR DE USUARIOS */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                                            <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2"><Activity size={18}/> Radar de Usuarios Conectados</h3>
                                            <p className="text-xs text-gray-500 mb-4 pb-2 border-b">Verifica si el internet de los otros usuarios y celulares está funcionando en este instante.</p>
                                            {systemPresence.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No hay datos de conexión aún. El personal no ha iniciado sesión hoy.</p> : (
                                                <div className="space-y-3">
                                                    {systemPresence.map(p => {
                                                        // Si lastSeen fue hace menos de 45 segundos, se considera Online.
                                                        const isUserOnline = (Date.now() - p.lastSeen) < 45000; 
                                                        return (
                                                            <div key={p.employee} className={`flex justify-between items-center p-4 rounded-xl border ${isUserOnline ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                                                <span className="font-bold text-sm text-gray-800">{p.employee}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-xs font-bold ${isUserOnline ? 'text-green-700' : 'text-red-700'}`}>{isUserOnline ? 'Conectado a la nube' : 'Aislado / Sin Red'}</span>
                                                                    <div className={`w-3 h-3 rounded-full shadow-sm ${isUserOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4 border-b pb-2">Registro de Conexión y Caídas Local</h3>
                                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                                {connectionLogs.map((log, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${log.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                            <span className={`font-bold ${log.status === 'online' ? 'text-green-700' : 'text-red-700'}`}>
                                                                {log.status === 'online' ? 'Conexión Restablecida' : 'Se Perdió la Conexión'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-bold">{log.time}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'dashboard' && (
                                    <div className="max-w-5xl mx-auto space-y-6">
                                        
                                        {/* OCUPACION VISUAL DE MESAS EN VIVO */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                                <h3 className="font-bold text-mandre-coffee flex-1">Ocupación Actual (Mesas Activas)</h3>
                                                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400">
                                                    <span className="w-2 h-2 rounded-full bg-mandre-orange"></span> Ocupada
                                                    <span className="w-2 h-2 rounded-full bg-gray-200 ml-2"></span> Libre
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                                {tables.map(t => (
                                                    <button key={t.id} onClick={() => t.status === 'ocupada' && setAdminViewTableOrder(t.id)} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${t.status === 'ocupada' ? 'border-mandre-orange bg-orange-50 scale-105 shadow-sm cursor-pointer hover:bg-orange-100' : 'border-gray-100 bg-gray-50 opacity-60 cursor-default'}`}>
                                                        <span className="text-xs font-bold uppercase text-center block mb-1 truncate w-full text-mandre-dark">{t.label || t.id}</span>
                                                        {t.status === 'ocupada' ? (
                                                            <span className="text-sm font-bold text-mandre-orange">${t.currentTotal.toLocaleString()}</span>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400">- Libre -</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* MODAL VISUAL DE MESA EN ADMIN */}
                                        {adminViewTableOrder && activeOrders[adminViewTableOrder] && (
                                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                                <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl relative animate-slideUp">
                                                    <button onClick={() => setAdminViewTableOrder(null)} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200"><X size={16}/></button>
                                                    <h3 className="font-bold text-lg text-mandre-coffee mb-1 uppercase">Mesa: {tables.find(t=>t.id?.toString()===adminViewTableOrder.toString())?.label || adminViewTableOrder}</h3>
                                                    <p className="text-xs text-gray-400 mb-4 font-bold uppercase tracking-wide">Cliente: <span className="text-mandre-dark">{activeOrders[adminViewTableOrder].customer}</span></p>
                                                    <div className="max-h-64 overflow-y-auto space-y-2 mb-4 border-t border-b border-gray-100 py-4">
                                                        {activeOrders[adminViewTableOrder].items.map(item => (
                                                            <div key={item.cartId} className="flex justify-between text-sm">
                                                                <span className="text-gray-600 font-medium">{item.quantity}x {item.name}</span>
                                                                <span className="font-bold text-mandre-dark">${(item.price * item.quantity).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex justify-between font-bold text-xl text-mandre-sage">
                                                        <span>TOTAL</span>
                                                        <span>${activeOrders[adminViewTableOrder].total.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* TOTAL CAJA VIVO */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                                <h3 className="text-xs text-red-500 uppercase font-bold">Total General en Vivo (Caja Abierta)</h3>
                                            </div>
                                            <div className="flex justify-between items-end mb-4">
                                                <p className="text-4xl font-bold text-mandre-coffee">
                                                    ${(orders.filter(o => !o.shiftId && o.method !== 'credito').reduce((a,b)=>a+b.total,0) + abonos.filter(a => !a.shiftId).reduce((a,b)=>a+b.amount,0)).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Efectivo Total (+Abonos)</p>
                                                    <p className="text-xl font-bold text-mandre-dark">
                                                        ${(orders.filter(o => !o.shiftId && o.method === 'efectivo').reduce((a,b)=>a+b.total,0) + abonos.filter(a => !a.shiftId && a.method === 'efectivo').reduce((a,b)=>a+b.amount,0)).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 text-purple-900">Nequi Total (+Abonos)</p>
                                                    <p className="text-xl font-bold text-purple-900">
                                                        ${(orders.filter(o => !o.shiftId && o.method === 'transferencia').reduce((a,b)=>a+b.total,0) + abonos.filter(a => !a.shiftId && a.method === 'transferencia').reduce((a,b)=>a+b.amount,0)).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4">Métricas en Vivo por Usuario (Turno Actual)</h3>
                                            <div className="space-y-3">
                                                {Object.keys(liveStats.users).length > 0 ? Object.entries(liveStats.users).map(([user, data]) => (
                                                    <div key={user} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-mandre-coffee text-white rounded-full flex items-center justify-center font-bold">{user[0]}</div>
                                                            <div>
                                                                <p className="font-bold text-sm text-mandre-coffee">{user}</p>
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Total Facturado+Abonos: <span className="text-mandre-sage">${data.total.toLocaleString()}</span></p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 md:gap-8 bg-white p-2 rounded-lg border border-gray-100 shadow-inner">
                                                            <div className="text-center px-2 border-r border-gray-100">
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Efectivo</p>
                                                                <p className="font-bold text-sm text-mandre-dark">${data.efectivo.toLocaleString()}</p>
                                                            </div>
                                                            <div className="text-center px-2">
                                                                <p className="text-[10px] text-purple-400 font-bold uppercase mb-0.5">Nequi</p>
                                                                <p className="font-bold text-sm text-purple-900">${data.nequi.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )) : <p className="text-sm text-gray-400 text-center py-4">No hay ventas registradas en el turno actual.</p>}
                                            </div>
                                        </div>

                                        {/* HARD RESET BUTTON */}
                                        <div className="mt-12 pt-8 border-t-2 border-dashed border-red-200 pb-10">
                                            <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 text-center">
                                                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3"><AlertTriangle/></div>
                                                <h3 className="font-bold text-red-600 mb-2">Zona de Peligro: Reinicio Completo</h3>
                                                <p className="text-xs text-red-500 mb-6 max-w-lg mx-auto">Esta acción borrará PERMANENTEMENTE todo el historial de ventas, cierres de caja, egresos, créditos, abonos, items manuales y limpiará las mesas activas de la nube para iniciar en modo producción en limpio. No afecta el inventario ni usuarios.</p>
                                                <button onClick={performHardReset} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition">BORRAR DATOS DE PRUEBA</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'payroll' && (
                                    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-4 border-mandre-sage/20">
                                            <h2 className="text-2xl font-bold text-mandre-coffee mb-2">Generar Pago (Nómina Semanal)</h2>
                                            <p className="text-sm text-gray-500 mb-6 border-b pb-4">Calcule el pago por horas trabajadas diariamente y envíe el comprobante.</p>
                                            
                                            <div className="space-y-6 mb-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Empleado a Pagar</label>
                                                        <select className="w-full border p-3 rounded-xl bg-white outline-none focus:border-mandre-sage font-medium shadow-sm" value={payrollForm.employee} onChange={e => setPayrollForm({...payrollForm, employee: e.target.value})}>
                                                            <option value="">Seleccionar Empleado...</option>
                                                            {users.map(u => <option key={u.id} value={`${u.name} ${u.surname}`}>{u.name} {u.surname}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Valor por Hora ($)</label>
                                                        <input type="number" className="w-full border p-3 rounded-xl bg-white outline-none focus:border-mandre-sage font-bold shadow-sm" placeholder="Ej: 5000" value={payrollForm.hourlyRate} onChange={e => setPayrollForm({...payrollForm, hourlyRate: e.target.value})}/>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold text-mandre-coffee uppercase mb-3 ml-1 tracking-widest">Horas trabajadas por día:</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                                                            <div key={day} className="bg-white p-3 rounded-xl border border-gray-200 focus-within:border-mandre-sage transition">
                                                                <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block text-center">{day}</label>
                                                                <input type="number" className="w-full bg-gray-50 p-2 rounded-lg text-center outline-none focus:bg-white font-bold" placeholder="0" value={payrollForm.hours[day]} onChange={e => setPayrollForm({...payrollForm, hours: {...payrollForm.hours, [day]: e.target.value}})}/>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={handleGeneratePayroll} className="w-full py-4 bg-mandre-sage text-white font-bold text-lg rounded-xl shadow-lg active:scale-95 transition hover:brightness-105">CALCULAR Y GENERAR COMPROBANTE</button>
                                        </div>

                                        {showPayrollReceipt && payrollData && (
                                            <div className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl animate-slideUp overflow-hidden flex flex-col border border-gray-200 mt-8 relative">
                                                <button onClick={() => setShowPayrollReceipt(false)} className="absolute top-4 right-4 text-gray-400 bg-gray-100 p-2 rounded-full hover:bg-gray-200"><X size={16}/></button>
                                                <div ref={payrollReceiptRef} className="bg-white p-8 text-center">
                                                    <div className="w-16 h-16 bg-mandre-sage text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><CheckCircle size={32}/></div>
                                                    <h2 className="text-xl font-bold text-mandre-coffee mb-1 tracking-widest">MANDRÉ</h2>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-6">Comprobante de Pago</p>
                                                    
                                                    <div className="bg-gray-50 p-4 rounded-xl text-left border border-gray-100 mb-6">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Colaborador</p>
                                                        <p className="font-bold text-lg text-mandre-dark">{payrollData.employee}</p>
                                                    </div>

                                                    <div className="text-left mb-6 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                                        <p className="text-xs font-bold text-gray-500 uppercase border-b pb-2 mb-2">Desglose Semanal</p>
                                                        <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600 mb-3">
                                                            {Object.entries(payrollData.hoursBreakdown).filter(([d, h]) => h && parseFloat(h)>0).map(([day, hrs]) => (
                                                                <React.Fragment key={day}>
                                                                    <span className="font-medium">{day}:</span>
                                                                    <span className="text-right font-bold">{hrs} hrs</span>
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between border-t pt-2 font-bold text-sm text-mandre-coffee">
                                                            <span>Total Horas:</span>
                                                            <span>{payrollData.totalHours} hrs</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                            <span>Valor x Hora:</span>
                                                            <span>${payrollData.rate.toLocaleString()}</span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-green-50 p-4 rounded-xl flex justify-between items-center border border-green-200 text-green-800">
                                                        <span className="font-bold uppercase text-xs">Total Pagado</span>
                                                        <span className="font-bold text-2xl">${payrollData.totalPayment.toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest">Emitido el {payrollData.date}</p>
                                                </div>
                                                <div className="p-4 bg-gray-50 border-t">
                                                    <button onClick={sharePayrollReceipt} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition"><Share size={20}/> COMPARTIR WHATSAPP</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {adminTab === 'credits' && (
                                    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm sticky top-0 z-10 border border-gray-100">
                                            <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2"><Shield size={18}/> Búsqueda de Créditos y Fiados</h3>
                                            <div className="grid grid-cols-1">
                                                <input className="border p-3 rounded-xl text-sm w-full bg-gray-50 focus:bg-white transition-colors outline-none focus:border-purple-300" placeholder="Buscar por Nombre de Cliente..." value={creditFilter} onChange={e => setCreditFilter(e.target.value)}/>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {credits.filter(c => c.customer.toLowerCase().includes(creditFilter.toLowerCase())).map(credit => (
                                                <div key={credit.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3">
                                                    <div className="flex justify-between items-start border-b pb-3">
                                                        <div>
                                                            <h4 className="font-bold text-mandre-dark text-lg uppercase tracking-wide">{credit.customer}</h4>
                                                            <p className="text-xs text-gray-500">Fecha Creado: {credit.date}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${credit.status === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                {credit.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-2">
                                                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Consumo:</p>
                                                        <div className="space-y-1">
                                                            {credit.items.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between text-xs text-gray-600">
                                                                    <span>{item.quantity}x {item.name}</span>
                                                                    <span>${(item.price * item.quantity).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
                                                        <div className="flex gap-6 w-full sm:w-auto">
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Deuda Inicial</p>
                                                                <p className="font-bold text-gray-500">${credit.total.toLocaleString()}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-purple-600 font-bold uppercase">Saldo Pendiente</p>
                                                                <p className="font-bold text-xl text-purple-900">${credit.balance.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        {credit.status === 'pendiente' && (
                                                            <button onClick={() => openAbonoModal(credit)} className="w-full sm:w-auto bg-purple-800 text-white px-6 py-3 rounded-xl font-bold shadow active:scale-95 transition">
                                                                REGISTRAR ABONO
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {credits.length === 0 && <p className="text-center text-gray-400 py-10">No hay créditos registrados o no coincide con la búsqueda.</p>}
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'cash_adjust' && (
                                    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                                        <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-blue-50">
                                            <div className="flex items-center gap-3 mb-6 border-b pb-4">
                                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><RefreshCw size={24}/></div>
                                                <div>
                                                    <h3 className="font-bold text-xl text-blue-900">Canjear Caja (Ajuste Interno)</h3>
                                                    <p className="text-xs text-gray-500">Agregue o retire efectivo de un usuario para cuadrar caja. Esto no saldrá en el ticket final.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">1. Seleccionar Usuario a afectar</label>
                                                    <select className="w-full border p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-blue-300 font-medium" value={cashAdjustForm.employee} onChange={e => setCashAdjustForm({...cashAdjustForm, employee: e.target.value})}>
                                                        <option value="">Seleccione Empleado...</option>
                                                        {users.map(u => <option key={u.id} value={`${u.name} ${u.surname}`}>{u.name} {u.surname}</option>)}
                                                    </select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">2. Acción</label>
                                                        <select className={`w-full border p-4 rounded-xl outline-none font-bold text-center transition ${cashAdjustForm.type === 'add' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`} value={cashAdjustForm.type} onChange={e => setCashAdjustForm({...cashAdjustForm, type: e.target.value})}>
                                                            <option value="add">➕ PONER Dinero</option>
                                                            <option value="sub">➖ QUITAR Dinero</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">3. Monto ($)</label>
                                                        <input type="number" className="w-full border p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-blue-300 font-bold text-xl text-center" placeholder="0" value={cashAdjustForm.amount} onChange={e => setCashAdjustForm({...cashAdjustForm, amount: e.target.value})}/>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={handleCashAdjust} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition text-lg uppercase tracking-wide">CONFIRMAR AJUSTE</button>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h4 className="font-bold text-gray-600 mb-4 text-sm">Historial de Ajustes Internos (Turno Actual)</h4>
                                            <div className="space-y-2">
                                                {cashAdjustments.filter(a => !a.shiftId).map(adj => (
                                                    <div key={adj.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                                                        <span><b>{adj.employee}</b> <span className="text-xs text-gray-400 ml-2">{adj.date.split(',')[1]}</span></span>
                                                        <span className={`font-bold ${adj.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>{adj.amount > 0 ? '+' : ''}{adj.amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                {cashAdjustments.filter(a => !a.shiftId).length === 0 && <p className="text-xs text-gray-400 text-center">No hay ajustes en este turno.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'transfers' && (
                                    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm sticky top-0 z-10 border border-gray-100">
                                            <h3 className="font-bold text-purple-900 mb-4">Filtros de Búsqueda (Nequi)</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input className="border p-3 rounded-xl text-sm w-full bg-gray-50 focus:bg-white transition-colors outline-none focus:border-purple-300" placeholder="Nombre Cliente..." value={transferFilter.name} onChange={e => setTransferFilter({...transferFilter, name: e.target.value})}/>
                                                <input type="date" className="border p-3 rounded-xl text-sm w-full bg-gray-50 focus:bg-white transition-colors outline-none focus:border-purple-300" value={transferFilter.date} onChange={e => setTransferFilter({...transferFilter, date: e.target.value})}/>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            {Object.entries(
                                                [...orders.filter(o => o.method === 'transferencia'), ...abonos.filter(a => a.method === 'transferencia')]
                                                .filter(o => 
                                                (transferFilter.name === '' || o.customer.toLowerCase().includes(transferFilter.name.toLowerCase())) &&
                                                (transferFilter.date === '' || o.isoDate === transferFilter.date)
                                            ).reduce((acc, order) => {
                                                const d = order.fullDate || order.isoDate;
                                                (acc[d] = acc[d] || []).push(order);
                                                return acc;
                                            }, {})).map(([date, dayOrders]) => (
                                                <div key={date}>
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">{date}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {dayOrders.map(order => (
                                                            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100 hover:border-purple-300 transition">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="bg-[#200020] text-white font-bold text-[10px] px-3 py-1 rounded-full">{order.creditId ? 'ABONO NEQUI' : 'NEQUI'}</span>
                                                                    <span className="text-xs text-gray-400">{order.date.split(',')[1]}</span>
                                                                </div>
                                                                <p className="font-bold text-mandre-dark mb-1 truncate">{order.customer}</p>
                                                                <p className="text-2xl font-bold text-purple-900 mb-2">${(order.total || order.amount).toLocaleString()}</p>
                                                                <p className="text-[10px] text-gray-400">Atendido por: {order.employee}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'expenses' && (
                                    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm sticky top-0 z-10 border border-gray-100">
                                            <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2"><Banknote size={18}/> Filtros de Egresos</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input className="border p-3 rounded-xl text-sm w-full bg-gray-50 focus:bg-white transition-colors outline-none focus:border-red-300" placeholder="Buscar por gasto o empleado..." value={expenseFilter.query} onChange={e => setExpenseFilter({...expenseFilter, query: e.target.value})}/>
                                                <input type="date" className="border p-3 rounded-xl text-sm w-full bg-gray-50 focus:bg-white transition-colors outline-none focus:border-red-300" value={expenseFilter.date} onChange={e => setExpenseFilter({...expenseFilter, date: e.target.value})}/>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {expenses.filter(e => 
                                                (expenseFilter.query === '' || e.desc.toLowerCase().includes(expenseFilter.query.toLowerCase()) || (e.employee && e.employee.toLowerCase().includes(expenseFilter.query.toLowerCase()))) &&
                                                (expenseFilter.date === '' || e.isoDate === expenseFilter.date)
                                            ).map(exp => (
                                                <div key={exp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-50 hover:border-red-200 transition flex flex-col md:flex-row justify-between md:items-center gap-3">
                                                    <div>
                                                        <h4 className="font-bold text-mandre-dark text-lg mb-1">{exp.desc}</h4>
                                                        <p className="text-xs text-gray-500">Registrado por: <b>{exp.employee || 'Admin'}</b></p>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className="text-2xl font-bold text-red-600 mb-1">-${exp.amount.toLocaleString()}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{exp.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {expenses.length === 0 && <p className="text-center text-gray-400 py-10">No hay egresos registrados.</p>}
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'products' && (
                                    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4">Agregar Nuevo Producto</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                                                <div className="sm:col-span-2 md:col-span-2">
                                                    <label className="text-xs font-bold text-gray-400">Nombre</label>
                                                    <input className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:border-mandre-sage transition" placeholder="Ej: Late Helado" value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})}/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Precio</label>
                                                    <input type="number" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none focus:border-mandre-sage transition" placeholder="$$$" value={newProductForm.price} onChange={e => setNewProductForm({...newProductForm, price: e.target.value})}/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Categoría</label>
                                                    <select className="w-full p-3 border rounded-xl bg-gray-50 outline-none" value={newProductForm.category} onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}>
                                                        {categories.filter(c=>c!=='Combos').map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Icono</label>
                                                    <select className="w-full p-3 border rounded-xl bg-gray-50 outline-none text-center" value={newProductForm.icon} onChange={e => setNewProductForm({...newProductForm, icon: e.target.value})}>
                                                        {['☕','🍵','🥪','🍰','🥗','🍹','🥤','🥐'].map(i => <option key={i} value={i}>{i}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <button onClick={createNewProduct} className="mt-4 w-full md:w-auto px-8 py-3 bg-mandre-coffee text-white font-bold rounded-xl shadow-lg active:scale-95 transition">Crear Producto en la Nube</button>
                                        </div>

                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4">Catálogo Actual en Firebase</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {inventory.map(prod => (
                                                    <div key={prod.id} className="flex justify-between items-center p-4 border rounded-xl group hover:border-mandre-sage transition bg-gray-50 hover:bg-white">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{prod.icon || '☕'}</span>
                                                            <div>
                                                                <p className="font-bold text-sm">{prod.name}</p>
                                                                <p className="text-xs text-gray-400">{prod.category}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-mandre-sage">${prod.price.toLocaleString()}</p>
                                                            <div className="flex gap-2 justify-end opacity-100 md:opacity-0 md:group-hover:opacity-100 transition mt-1">
                                                                <button onClick={() => startEditingItem('product', prod)} className="text-blue-500 bg-blue-50 p-1.5 rounded hover:bg-blue-100"><Edit3 size={14}/></button>
                                                                <button onClick={() => deleteInventoryItem('product', prod.id)} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100"><Trash2 size={14}/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'users' && (
                                    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4">Crear Nuevo Usuario</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Nombre</label>
                                                    <input className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none" placeholder="Ej: Juan" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Apellido</label>
                                                    <input className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none" placeholder="Ej: Perez" value={newUserForm.surname} onChange={e => setNewUserForm({...newUserForm, surname: e.target.value})}/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Usuario (Login)</label>
                                                    <input className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none" placeholder="Ej: juan.perez" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})}/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-400">Contraseña</label>
                                                    <input type="password" className="w-full p-3 border rounded-xl bg-gray-50 focus:bg-white outline-none" placeholder="******" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}/>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-xs font-bold text-gray-400">Correo Corporativo</label>
                                                    <div className="flex flex-col sm:flex-row items-stretch">
                                                        <input className="w-full sm:flex-1 p-3 border rounded-t-xl sm:rounded-l-xl sm:rounded-r-none bg-gray-50 focus:bg-white outline-none text-center sm:text-left" placeholder="juan.perez" value={newUserForm.emailPrefix} onChange={e => setNewUserForm({...newUserForm, emailPrefix: e.target.value})}/>
                                                        <span className="w-full sm:w-auto bg-gray-200 p-3 border border-t-0 sm:border-t sm:border-l-0 rounded-b-xl sm:rounded-r-xl sm:rounded-l-none text-gray-600 font-bold text-center flex items-center justify-center">@mandre.com</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={createNewUser} className="mt-6 w-full md:w-auto px-8 py-3 bg-mandre-coffee text-white font-bold rounded-xl shadow-lg active:scale-95 transition">Registrar en Nube</button>
                                        </div>

                                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <h3 className="font-bold text-mandre-coffee mb-4">Equipo Sincronizado</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {users.map(u => (
                                                    <div key={u.id} className="flex justify-between items-center p-4 border rounded-xl bg-gray-50 hover:bg-white transition">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-mandre-sage/20 rounded-full flex items-center justify-center text-mandre-sage font-bold shrink-0">{u.name[0]}</div>
                                                            <div className="overflow-hidden">
                                                                <p className="font-bold text-sm truncate">{u.name} {u.surname}</p>
                                                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] sm:text-xs font-bold bg-white px-2 py-1 rounded border shadow-sm text-gray-500 truncate ml-2">@{u.username}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'combos' && (
                                    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-8 max-w-4xl mx-auto border border-gray-100">
                                        <h3 className="font-bold text-xl text-mandre-coffee mb-6 border-b pb-4">Gestor de Combos</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-gray-50 p-6 rounded-2xl">
                                                <h4 className="text-sm font-bold text-gray-600 mb-4">Crear Nuevo Combo</h4>
                                                <div className="space-y-3 mb-6">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nombre Comercial</label>
                                                        <input placeholder="Ej: Combo Desayuno" className="w-full border p-3 rounded-xl bg-white outline-none focus:border-mandre-sage" value={newCombo.name} onChange={e => setNewCombo({...newCombo, name: e.target.value})}/>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Precio Final</label>
                                                        <input type="number" placeholder="$$$" className="w-full border p-3 rounded-xl bg-white outline-none focus:border-mandre-sage" value={newCombo.price} onChange={e => setNewCombo({...newCombo, price: e.target.value})}/>
                                                    </div>
                                                </div>
                                                <button onClick={handleCreateCombo} className="w-full bg-mandre-coffee text-white py-3 rounded-xl font-bold active:scale-95 transition shadow-md">GUARDAR COMBO</button>
                                            </div>
                                            
                                            <div className="border border-gray-200 rounded-2xl p-4 flex flex-col bg-white">
                                                <p className="text-xs font-bold text-gray-500 mb-3 bg-gray-100 p-2 rounded text-center">Selecciona los productos que lo conforman:</p>
                                                <div className="flex-1 overflow-y-auto max-h-64 pr-2 space-y-1">
                                                    {inventory.map(p => (
                                                        <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${newCombo.items.includes(p.id) ? 'bg-mandre-sage/10 border-mandre-sage text-mandre-sage font-bold' : 'hover:bg-gray-50 border-transparent text-gray-600'}`}>
                                                            <input type="checkbox" checked={newCombo.items.includes(p.id)} onChange={() => toggleItemInCombo(p.id)} className="accent-mandre-sage w-5 h-5"/>
                                                            <span className="text-sm">{p.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 border-t pt-6">
                                            <h4 className="font-bold text-mandre-coffee mb-4">Combos Activos en Firebase</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {combos.map(c => (
                                                    <div key={c.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50">
                                                        <div>
                                                            <span className="font-bold block text-sm">{c.name}</span>
                                                            <span className="text-[10px] text-gray-400">{c.items.length} items incluidos</span>
                                                        </div>
                                                        <span className="font-bold text-mandre-sage bg-white px-3 py-1 rounded-lg border shadow-sm">${c.price.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                {combos.length === 0 && <p className="text-gray-400 text-sm italic col-span-full">No hay combos creados.</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'manual_items' && (
                                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden max-w-5xl mx-auto p-4 md:p-6 animate-fadeIn border border-gray-100">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4 mb-6 gap-4">
                                            <h3 className="font-bold text-lg text-mandre-coffee">Registro de Items Manuales en Nube</h3>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input className="border p-2 rounded-lg text-sm outline-none focus:border-mandre-sage" placeholder="Buscar por nombre..." value={manualItemFilter.name} onChange={e => setManualItemFilter({...manualItemFilter, name: e.target.value})}/>
                                                <input type="number" className="border p-2 rounded-lg text-sm outline-none focus:border-mandre-sage" placeholder="Precio exacto..." value={manualItemFilter.price} onChange={e => setManualItemFilter({...manualItemFilter, price: e.target.value})}/>
                                                <input type="date" className="border p-2 rounded-lg text-sm outline-none focus:border-mandre-sage" value={manualItemFilter.date} onChange={e => setManualItemFilter({...manualItemFilter, date: e.target.value})}/>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            {manualItemsCollection.filter(item => 
                                                (manualItemFilter.name === '' || item.name.toLowerCase().includes(manualItemFilter.name.toLowerCase())) &&
                                                (manualItemFilter.price === '' || item.price.toString() === manualItemFilter.price) &&
                                                (manualItemFilter.date === '' || item.isoDate === manualItemFilter.date)
                                            ).map((item) => (
                                                <div key={item.id} className="border rounded-2xl p-4 bg-gray-50 hover:bg-white transition flex flex-col md:flex-row justify-between md:items-center gap-3">
                                                    <div>
                                                        <h4 className="font-bold text-mandre-dark">{item.name}</h4>
                                                        <p className="text-xs text-gray-500">Registrado por: <b>{item.employee || 'Admin'}</b></p>
                                                    </div>
                                                    <div className="text-left md:text-right">
                                                        <p className="text-xl font-bold text-mandre-sage mb-1">${item.price.toLocaleString()} <span className="text-xs text-gray-400 font-medium ml-1">x{item.qty}</span></p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{item.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {manualItemsCollection.length === 0 && <p className="text-center text-gray-400 italic py-10">No hay items manuales registrados.</p>}
                                        </div>
                                    </div>
                                )}

                                {adminTab === 'shifts' && (
                                    <div className="max-w-5xl mx-auto animate-fadeIn">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                            <h3 className="font-bold text-lg text-mandre-coffee">Historial de Cierres de Caja</h3>
                                            <button onClick={() => { if(confirm("¿Cerrar todas las cajas abiertas?")) performClosure(false); }} className="w-full sm:w-auto bg-red-500 text-white px-4 py-3 sm:py-2 rounded-xl text-xs font-bold shadow hover:bg-red-600 transition active:scale-95">
                                                CIERRE GENERAL
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {shifts.map((shift) => (
                                                <div key={shift.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 relative">
                                                    <button onClick={() => deleteShift(shift.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-400 p-2"><Trash2 size={18}/></button>
                                                    
                                                    <div className="flex justify-between items-start border-b pb-3">
                                                        <div>
                                                            <p className="font-bold text-mandre-coffee text-lg">{shift.date}</p>
                                                            <p className="text-xs text-gray-400 uppercase font-bold">{shift.employee} {shift.isAuto && '(AUTO)'}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Ventas (+Abonos)</p>
                                                            <p className="font-bold text-mandre-sage text-lg">${(shift.totalVentas || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-center flex flex-col justify-center">
                                                            <p className="text-[9px] uppercase font-bold text-gray-500 mb-1 leading-tight">Efectivo(Sist)</p>
                                                            <p className="font-bold text-mandre-dark">${shift.expectedCash?.toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center flex flex-col justify-center">
                                                            <p className="text-[9px] uppercase font-bold text-red-500 mb-1">Egresos</p>
                                                            <p className="font-bold text-red-600">-${(shift.totalExpensesAmount || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 text-center flex flex-col justify-center">
                                                            <p className="text-[9px] uppercase font-bold text-blue-600 mb-1 leading-tight">Ajuste(Interno)</p>
                                                            <p className="font-bold text-blue-700">{shift.totalAdjustments > 0 ? '+' : ''}{(shift.totalAdjustments || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="bg-purple-50 p-2 rounded-xl border border-purple-100 text-center flex flex-col justify-center">
                                                            <p className="text-[9px] uppercase font-bold text-purple-800 mb-1">Nequi</p>
                                                            <p className="font-bold text-purple-900">${shift.nequiTotal?.toLocaleString() || 0}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                                                        <span className="text-sm text-gray-600 font-bold">Efectivo Contado (Físico):</span>
                                                        <span className="font-bold text-lg">${shift.countedCash?.toLocaleString()}</span>
                                                    </div>
                                                    
                                                    <div className={`text-center py-2 rounded-lg ${shift.diff >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                        <p className="text-xs font-bold uppercase">{shift.diff >= 0 ? 'Sobrante de Caja' : 'Faltante de Caja'}</p>
                                                        <p className="font-bold text-xl">{shift.diff > 0 ? '+' : ''}${shift.diff.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {shifts.length === 0 && <p className="text-center text-gray-400 italic py-10">No hay cierres registrados.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MODAL ABONAR CREDITO */}
                    {isAbonoModalOpen && activeCredit && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-3xl w-full max-w-sm animate-slideUp shadow-2xl border-4 border-purple-50">
                                <div className="flex justify-between items-center mb-6 border-b pb-3">
                                    <div className="flex items-center gap-2 text-purple-800">
                                        <Shield size={20}/>
                                        <h3 className="font-bold text-lg">Abonar a Crédito</h3>
                                    </div>
                                    <button onClick={() => setIsAbonoModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200"><X size={18}/></button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    <div className="text-center bg-gray-50 py-3 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase font-bold">Cliente</p>
                                        <p className="font-bold text-lg text-mandre-dark">{activeCredit.customer}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">¿Cuánto va a abonar?</label>
                                        <input type="number" className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-purple-400 font-bold text-xl text-purple-800" value={abonoForm.amount} onChange={e => setAbonoForm({...abonoForm, amount: e.target.value})} placeholder="0"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Método de Pago</label>
                                        <select className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 outline-none font-medium" value={abonoForm.method} onChange={e => setAbonoForm({...abonoForm, method: e.target.value})}>
                                            <option value="efectivo">Efectivo</option>
                                            <option value="transferencia">Nequi</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Seleccione el Empleado que recibe el dinero</label>
                                        <select className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 outline-none font-medium" value={abonoForm.assignedUser} onChange={e => setAbonoForm({...abonoForm, assignedUser: e.target.value})}>
                                            <option value="">Seleccionar Usuario...</option>
                                            {users.map(u => <option key={u.id} value={`${u.name} ${u.surname}`}>{u.name} {u.surname}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button disabled={isProcessingPayment} onClick={handleAbono} className="w-full py-4 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl shadow-lg active:scale-95 transition disabled:opacity-50">
                                    REGISTRAR ABONO EN CAJA
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODAL EDICION INVENTARIO RAPIDA */}
                    {editItem && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-3xl w-full max-w-sm animate-slideUp shadow-2xl">
                                <h3 className="font-bold text-mandre-coffee mb-6 text-lg border-b pb-2">Editar Producto</h3>
                                <div className="space-y-4 mb-8">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nombre</label>
                                        <input className="w-full border p-3 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-mandre-sage" value={editItem.data.name} onChange={e => setEditItem({...editItem, data: {...editItem.data, name: e.target.value}})} placeholder="Nombre"/>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Precio</label>
                                            <input type="number" className="w-full border p-3 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-mandre-sage" value={editItem.data.price} onChange={e => setEditItem({...editItem, data: {...editItem.data, price: parseFloat(e.target.value)}})} placeholder="Precio"/>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setEditItem(null)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition">Cancelar</button>
                                    <button onClick={saveEditedItem} className="flex-1 py-3 bg-mandre-coffee text-white font-bold rounded-xl shadow-lg active:scale-95 transition">Guardar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODAL PRODUCTO MANUAL */}
                    {isOpenProductModalOpen && (
                         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-3xl w-full max-w-sm animate-slideUp shadow-2xl">
                                <div className="flex justify-between items-center mb-6 border-b pb-3">
                                    <h3 className="font-bold text-mandre-coffee text-lg">Agregar Producto Manual</h3>
                                    <button onClick={() => setIsOpenProductModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500"><X size={18}/></button>
                                </div>
                                <div className="space-y-4 mb-8">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Descripción del Ítem</label>
                                        <input className="w-full border p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-mandre-sage font-medium" value={manualProduct.name} onChange={e => setManualProduct({...manualProduct, name: e.target.value})} placeholder="Ej: Recargo extra..." autoFocus/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Valor ($)</label>
                                        <input type="number" className="w-full border p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-mandre-sage font-bold text-lg" value={manualProduct.price} onChange={e => setManualProduct({...manualProduct, price: e.target.value})} placeholder="0"/>
                                    </div>
                                </div>
                                <button onClick={addManualProduct} className="w-full py-4 bg-mandre-coffee text-white font-bold rounded-xl shadow-lg active:scale-95 transition">AÑADIR A LA COMANDA</button>
                            </div>
                        </div>
                    )}

                    {/* MODAL REGISTRO EGRESO (GASTO) */}
                    {isExpenseModalOpen && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-3xl w-full max-w-md animate-slideUp shadow-2xl border-4 border-red-50">
                                <div className="flex justify-between items-center mb-6 border-b pb-3">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <Banknote size={24}/>
                                        <h3 className="font-bold text-lg">Registrar Egreso / Gasto</h3>
                                    </div>
                                    <button onClick={() => setIsExpenseModalOpen(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200"><X size={18}/></button>
                                </div>
                                <div className="space-y-4 mb-8">
                                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 mb-4">
                                        <b>Importante:</b> Este monto se descontará automáticamente del efectivo esperado en el cierre de caja.
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Descripción del Gasto</label>
                                        <input className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-red-400 font-medium" value={expenseForm.desc} onChange={e => setExpenseForm({...expenseForm, desc: e.target.value})} placeholder="Ej: Compra de hielo, pago proveedor..." autoFocus/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Valor ($) retirado de caja</label>
                                        <input type="number" className="w-full border border-gray-200 p-4 rounded-xl bg-gray-50 outline-none focus:bg-white focus:border-red-400 font-bold text-xl text-red-600" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0"/>
                                    </div>
                                </div>
                                <button onClick={handleSaveExpense} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-2 uppercase tracking-wide">
                                    CONFIRMAR RETIRO
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODAL CIERRE DE CAJA */}
                    {isClosureModalOpen && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            {!closureResult ? (
                                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
                                    <div className="bg-mandre-coffee p-4 text-white flex justify-between items-center shrink-0">
                                        <h3 className="font-bold text-lg">Arqueo de Efectivo Físico</h3>
                                        <button onClick={() => setIsClosureModalOpen(false)}><X/></button>
                                    </div>
                                    <div className="p-4 md:p-6 overflow-y-auto">
                                        <p className="text-xs text-gray-500 mb-4 text-center font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">Cuente el dinero en caja fuerte/registradora e ingrese la cantidad de cada billete o moneda.</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {DENOMINATIONS.map(d => (
                                                <div key={d.id} className="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-mandre-sage focus-within:ring-2 focus-within:ring-mandre-sage/20 transition-all">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase text-center mb-2">{d.label}</span>
                                                    <input type="number" inputMode="numeric" min="0" placeholder="0" className="w-full bg-white border border-gray-200 p-2 rounded-lg text-center font-bold text-xl shadow-sm outline-none text-mandre-coffee" value={cashCountDetails[d.id] || ''} onChange={e => handleCashCountChange(d.id, e.target.value)}/>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-white border-t shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
                                        <div className="flex justify-between items-center mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Suma Física:</span>
                                            <span className="text-2xl font-bold text-mandre-coffee">${calculateCountedTotal().toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => performClosure(false)} className="w-full py-4 bg-mandre-coffee text-white font-bold rounded-xl shadow-lg active:scale-95 transition text-lg">CERRAR TURNO Y NUBE</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-slideUp overflow-hidden flex flex-col max-h-[95vh]">
                                    <div className="flex-1 overflow-y-auto bg-white p-2">
                                        <div ref={closureReportRef} className="bg-white p-8 text-center border-4 border-white">
                                            <div className="w-20 h-20 bg-mandre-coffee rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg"><IconLeaf/></div>
                                            <h2 className="text-3xl font-bold text-mandre-coffee mb-1 tracking-widest">MANDRÉ</h2>
                                            <p className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-8">Specialty Coffee & Wellness</p>
                                            
                                            <div className="grid grid-cols-2 gap-4 text-left text-sm mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Encargado</p>
                                                    <p className="font-bold text-mandre-dark text-lg">{closureResult.employee}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Fecha Cierre</p>
                                                    <p className="font-bold text-mandre-dark text-lg">{new Date().toLocaleDateString()}</p>
                                                    <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
                                                </div>
                                            </div>

                                            {/* BALANCE GENERAL */}
                                            <div className="mb-6">
                                                <h4 className="text-left text-xs font-bold text-mandre-coffee uppercase border-b pb-2 mb-4">Totalización del Turno</h4>
                                                <div className="flex justify-between items-center mb-2 bg-mandre-sage/10 p-3 rounded-lg border border-mandre-sage/30">
                                                    <span className="font-bold text-mandre-coffee">TOTAL VENTAS GENERAL</span>
                                                    <span className="font-bold text-xl text-mandre-coffee">${closureResult.totalVentas.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-2 px-3">
                                                    <span className="text-gray-500 text-sm">Ventas Efectivo (+Abonos)</span>
                                                    <span className="font-bold text-sm">${(closureResult.expectedCash - closureResult.totalAdjustments + closureResult.totalExpensesAmount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-4 px-3">
                                                    <span className="text-purple-800 text-sm font-bold">Nequi (+Abonos)</span>
                                                    <span className="font-bold text-sm text-purple-900">${closureResult.nequiTotal.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* ARQUEO EFECTIVO */}
                                            <div className="mb-8">
                                                <h4 className="text-left text-xs font-bold text-mandre-coffee uppercase border-b pb-2 mb-4">Arqueo de Efectivo Físico</h4>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-gray-500">Venta Efectivo (+Abonos)</span>
                                                    <span className="font-bold">${(closureResult.expectedCash - closureResult.totalAdjustments + closureResult.totalExpensesAmount).toLocaleString()}</span>
                                                </div>
                                                
                                                {/* Mostrar Abonos Específicos si los hay */}
                                                {closureResult.abonosEfectivo > 0 && (
                                                    <div className="flex justify-between items-center mb-2 text-purple-700">
                                                        <span className="font-medium">↳ Incluye Abonos (Dinero de más)</span>
                                                        <span className="font-bold">${closureResult.abonosEfectivo.toLocaleString()}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center mb-2 text-red-500">
                                                    <span className="font-medium">- Egresos (Descuento)</span>
                                                    <span className="font-bold">-${closureResult.totalExpensesAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-100">
                                                    <span className="text-gray-800 font-bold uppercase text-xs">A Entregar (Esperado)</span>
                                                    <span className="font-bold text-lg">${(closureResult.expectedCash - closureResult.totalAdjustments).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-gray-500">Efectivo Contado</span>
                                                    <span className="font-bold">${closureResult.countedCash.toLocaleString()}</span>
                                                </div>
                                                <div className={`p-4 rounded-xl flex justify-between items-center ${closureResult.diff >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    <span className="font-bold uppercase text-xs">{closureResult.diff >= 0 ? 'SOBRANTE DE CAJA' : 'FALTANTE DE CAJA'}</span>
                                                    <span className="font-bold text-xl">{closureResult.diff > 0 ? '+' : ''}${closureResult.diff.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* LISTA DE EGRESOS */}
                                            {closureResult.expensesList && closureResult.expensesList.length > 0 && (
                                                <div className="mb-8 bg-red-50/50 p-4 rounded-xl border border-red-100">
                                                    <h4 className="text-left text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-2"><Banknote size={12}/> Egresos Registrados</h4>
                                                    <div className="space-y-2">
                                                        {closureResult.expensesList.map((exp, i) => (
                                                            <div key={i} className="flex justify-between text-xs border-b border-red-100 pb-1 last:border-0">
                                                                <span className="text-left flex-1 pr-2 truncate">{exp.desc} <span className="opacity-50 ml-1">({exp.date.split(',')[1].trim()})</span></span>
                                                                <span className="font-bold text-red-600">-${exp.amount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* ITEMS MANUALES */}
                                            {closureResult.manualItems && closureResult.manualItems.length > 0 && (
                                                <div className="mb-8 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                                                    <h4 className="text-left text-xs font-bold text-yellow-700 uppercase mb-3 flex items-center gap-2"><Tag size={12}/> Items Manuales Vendidos</h4>
                                                    <div className="space-y-2">
                                                        {closureResult.manualItems.map((item, i) => (
                                                            <div key={i} className="flex justify-between text-xs border-b border-yellow-200/50 pb-1 last:border-0">
                                                                <span>{item.name} <span className="opacity-50">x{item.qty}</span></span>
                                                                <span className="font-bold">${(item.price * item.qty).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* FIRMA */}
                                            <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300">
                                                <div className="h-16"></div>
                                                <p className="text-xs uppercase font-bold text-gray-400">Firma Responsable</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t shrink-0 flex flex-col gap-3">
                                        <button onClick={shareClosureReport} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition"><Share size={20}/> COMPARTIR EN WHATSAPP</button>
                                        <button onClick={() => { setIsClosureModalOpen(false); setView('start'); }} className="w-full py-3 bg-white border text-gray-500 font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition text-sm">FINALIZAR Y SALIR</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODAL PAGO */}
                    {isPaymentModalOpen && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-slideUp overflow-hidden max-h-[90vh] flex flex-col">
                                <div className="bg-mandre-coffee p-5 text-white flex justify-between items-center shrink-0">
                                    <h3 className="font-bold text-lg">
                                        {paymentStep === 'method' ? 'Método de Pago' : 
                                         paymentStep === 'cash' ? 'Pago en Efectivo' : 
                                         paymentStep === 'credit' ? 'Dar a Crédito (Fiar)' : 'Pago por Nequi'}
                                    </h3>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="bg-white/20 p-2 rounded-full"><X size={18}/></button>
                                </div>
                                
                                <div className="p-6 md:p-8 overflow-y-auto flex-1">
                                    <div className="text-center mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total a Cobrar</span>
                                        <div className="text-4xl font-bold text-mandre-coffee mt-2">${total.toLocaleString()}</div>
                                        {/* NOMBRE PARA TRANSFERENCIA Y CRÉDITO */}
                                        {(paymentStep === 'transfer' || paymentStep === 'credit') && (
                                            <div className="mt-6 animate-fadeIn">
                                                <input className="w-full p-4 bg-white border border-purple-200 shadow-sm rounded-xl text-center font-bold outline-none focus:border-purple-600 transition" placeholder="Nombre Completo del Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} autoFocus/>
                                            </div>
                                        )}
                                    </div>

                                    {/* PASO 1: SELECCIÓN MÉTODO */}
                                    {paymentStep === 'method' && (
                                        <div className="space-y-4">
                                            <button onClick={() => setPaymentStep('cash')} className="w-full py-5 bg-mandre-sage/10 border border-mandre-sage text-mandre-coffee font-bold text-lg rounded-2xl hover:bg-mandre-sage/20 transition flex items-center justify-center gap-3 active:scale-95 shadow-sm">
                                                <Banknote size={24}/> EFECTIVO
                                            </button>
                                            <button onClick={() => setPaymentStep('transfer')} className="w-full py-5 bg-[#200020] text-white font-bold text-lg rounded-2xl hover:bg-[#300030] transition flex items-center justify-center gap-3 shadow-lg active:scale-95">
                                                <Phone size={24}/> NEQUI
                                            </button>
                                            <button onClick={() => setPaymentStep('credit')} className="w-full py-4 bg-purple-100 text-purple-900 border border-purple-300 font-bold text-base rounded-2xl hover:bg-purple-200 transition flex items-center justify-center gap-2 active:scale-95 mt-4">
                                                <Shield size={20}/> DAR A CRÉDITO
                                            </button>
                                        </div>
                                    )}

                                    {/* PASO 2: EFECTIVO */}
                                    {paymentStep === 'cash' && (
                                        <div className="animate-fadeIn flex flex-col h-full">
                                            <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex-1">
                                                <label className="text-xs font-bold text-gray-400 uppercase text-center block mb-2">Monto Recibido Físico</label>
                                                <input type="number" placeholder="0" value={cashGiven} onChange={e => setCashGiven(e.target.value)} className="w-full bg-white border rounded-xl p-4 text-3xl font-bold outline-none text-center shadow-inner focus:border-mandre-sage transition" autoFocus/>
                                                <div className="text-center mt-6 p-4 rounded-xl bg-white border border-gray-100">
                                                    <span className="text-sm font-bold text-gray-500 uppercase">Cambio a Entregar:</span> 
                                                    <div className={`text-3xl font-bold mt-1 ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>${changeDue.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => handleFinalizePayment('efectivo', 'Caja')} disabled={changeDue < 0 || isProcessingPayment} className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl shadow-lg disabled:opacity-50 active:scale-95 transition mb-4">CONFIRMAR PAGO EFECTIVO</button>
                                            <button onClick={() => setPaymentStep('method')} className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl active:scale-95 transition text-sm">VOLVER ATRÁS</button>
                                        </div>
                                    )}

                                    {/* PASO 3: TRANSFERENCIA (NEQUI) */}
                                    {paymentStep === 'transfer' && (
                                        <div className="animate-fadeIn flex flex-col h-full">
                                            <div className="flex-1 flex flex-col items-center justify-center">
                                                 <button 
                                                    onClick={() => handleFinalizePayment('transferencia', 'Nequi')}
                                                    disabled={isProcessingPayment || !customerName.trim()}
                                                    className="bg-[#200020] text-white h-20 w-full rounded-2xl font-bold text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                                                >
                                                    CONFIRMAR PAGO NEQUI
                                                </button>
                                                {!customerName.trim() && <p className="text-red-500 text-xs text-center mt-4 font-bold">Ingrese el nombre del cliente arriba para confirmar</p>}
                                            </div>
                                            <button onClick={() => setPaymentStep('method')} className="w-full mt-8 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl active:scale-95 transition text-sm">VOLVER ATRÁS</button>
                                        </div>
                                    )}

                                    {/* PASO 4: CRÉDITO */}
                                    {paymentStep === 'credit' && (
                                        <div className="animate-fadeIn flex flex-col h-full">
                                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                <div className="bg-purple-50 text-purple-900 p-4 rounded-xl border border-purple-200 mb-6 text-sm">
                                                    Este monto se enviará al área de administración bajo el nombre proporcionado y <b>no sumará a la caja de hoy</b> hasta que se registre el abono.
                                                </div>
                                                 <button 
                                                    onClick={() => handleFinalizePayment('credito', 'Crédito')}
                                                    disabled={isProcessingPayment || !customerName.trim()}
                                                    className="bg-purple-800 text-white h-20 w-full rounded-2xl font-bold text-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                                                >
                                                    CONFIRMAR FIADO
                                                </button>
                                                {!customerName.trim() && <p className="text-red-500 text-xs text-center mt-4 font-bold">Ingrese el nombre completo del cliente para fiar</p>}
                                            </div>
                                            <button onClick={() => setPaymentStep('method')} className="w-full mt-8 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl active:scale-95 transition text-sm">VOLVER ATRÁS</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VISTA LOGIN INICIAL */}
                    {view === 'start' && (
                        <div className="fixed inset-0 bg-mandre-bone z-50 flex items-center justify-center p-6">
                            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center animate-slideUp relative">
                                {/* INDICADORES LOGIN REMOVIDOS PARA ESTA VISTA SEGÚN REQUERIMIENTO */}

                                <div className="w-24 h-24 bg-mandre-coffee rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white"><IconLeaf /></div>
                                <h1 className="text-3xl font-bold text-mandre-coffee mb-2 tracking-widest">MANDRÉ</h1>
                                <p className="text-gray-400 mb-10 text-xs font-bold uppercase tracking-wider">Specialty Coffee & Wellness</p>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <input 
                                        type="text" 
                                        placeholder="Usuario o Correo" 
                                        className="w-full p-5 bg-gray-50 border border-gray-200 focus:border-mandre-sage focus:bg-white rounded-2xl outline-none font-bold text-center transition shadow-sm" 
                                        value={loginData.identifier} 
                                        onChange={e => setLoginData({...loginData, identifier: e.target.value})} 
                                        autoFocus
                                    />
                                    <input 
                                        type="password" 
                                        placeholder="Contraseña" 
                                        className="w-full p-5 bg-gray-50 border border-gray-200 focus:border-mandre-sage focus:bg-white rounded-2xl outline-none font-bold text-center transition shadow-sm" 
                                        value={loginData.password} 
                                        onChange={e => setLoginData({...loginData, password: e.target.value})} 
                                    />
                                    <div className="pt-4">
                                        <button className="w-full py-5 bg-mandre-coffee text-white font-bold text-lg rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition">INICIAR SESIÓN</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* LOGIN ADMIN */}
                    {view === 'admin_login' && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <form onSubmit={e => {e.preventDefault(); if(adminPass === '1234') setView('admin_panel'); else alert("PIN Incorrecto")}} className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl w-full max-w-sm text-center animate-slideUp">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-mandre-coffee"><Lock size={24}/></div>
                                <h2 className="font-bold text-xl text-mandre-coffee mb-6">Acceso Administrador</h2>
                                <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="• • • •" className="w-full p-5 bg-gray-50 rounded-2xl text-center text-3xl tracking-[1em] font-bold mb-6 outline-none focus:border-mandre-sage focus:bg-white border-2 border-transparent transition shadow-inner" maxLength="4" autoFocus/>
                                <button className="w-full py-4 bg-mandre-coffee text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition text-lg mb-4">INGRESAR PANEL</button>
                                <button type="button" onClick={() => setView('pos')} className="w-full py-3 text-sm font-bold text-gray-400 bg-gray-50 rounded-xl hover:bg-gray-100 transition">Volver al POS</button>
                            </form>
                        </div>
                    )}

                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
