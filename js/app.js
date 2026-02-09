// Sistema de Vendas Lanchonete - 100% Offline
// Desenvolvido por Leonel Souza - Suporte WhatsApp: (67) 9.99847-7546

const { useState, useEffect, createContext, useContext } = React;

// ============= TOAST CONTEXT =============
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const showToast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    };
    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(t => (
                    <div key={t.id} className={`px-6 py-3 rounded-lg shadow-lg animate-in font-bold ${
                        t.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>{t.msg}</div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
const useToast = () => useContext(ToastContext);

// ============= COMPONENTS =============
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className={`bg-white rounded-3xl ${sizes[size]} max-h-[90vh] overflow-y-auto p-6`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-700">×</button>
                </div>
                {children}
            </div>
        </div>
    );
};

const ImgUpload = ({ img, onChange, label, icon = '📷' }) => {
    const [preview, setPreview] = useState(img);
    const ref = React.useRef();
    useEffect(() => setPreview(img), [img]);
    const handle = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        try {
            const r = await resizeImage(f);
            setPreview(r);
            onChange(r);
        } catch (err) { alert(err.message); }
    };
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-all bg-gray-50"
                 onClick={() => ref.current?.click()}>
                {preview ? <img src={preview} className="w-full h-full object-cover rounded-2xl" /> : <span className="text-4xl">{icon}</span>}
            </div>
            <input ref={ref} type="file" accept="image/*" onChange={handle} className="hidden" />
            {label && <p className="text-sm text-gray-600">{label}</p>}
            {preview && <button onClick={() => { setPreview(null); onChange(null); }} className="text-xs text-red-600">Remover</button>}
        </div>
    );
};

const Layout = ({ children, page, onNav }) => {
    const items = [
        { id: 'dash', icon: '📊', label: 'Dashboard' },
        { id: 'vendas', icon: '🛒', label: 'Vendas' },
        { id: 'clientes', icon: '👥', label: 'Clientes' },
        { id: 'produtos', icon: '📦', label: 'Produtos' },
        { id: 'fiados', icon: '💳', label: 'Fiados' },
        { id: 'relatorios', icon: '📈', label: 'Relatórios' },
        { id: 'config', icon: '⚙️', label: 'Config' },
        { id: 'suporte', icon: '💬', label: 'Suporte' },
    ];
    return (
        <div className="min-h-screen bg-stone-50">
            <header className="bg-white border-b shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl">🛒</div>
                            <div>
                                <h1 className="text-xl font-bold">Sistema de Vendas Lanchonete</h1>
                                <p className="text-xs text-gray-500">100% Offline</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <nav className="bg-white border-b sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
                    {items.map(i => (
                        <button key={i.id} onClick={() => onNav(i.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                    page === i.id ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-orange-50'}`}>
                            {i.icon} {i.label}
                        </button>
                    ))}
                </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 py-6 pb-24">{children}</main>
        </div>
    );
};

console.log('✓ Base carregada');

// ============= PAGES =============

// DASHBOARD
const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => { load(); }, []);
    
    const load = async () => {
        const sales = await db.getAll('sales');
        const prods = await db.getAll('products');
        const debts = await db.getAll('debts');
        
        const total = sales.reduce((s, sale) => s + sale.total, 0);
        const pago = sales.filter(s => s.tipo === 'PAGO').reduce((s, sale) => s + sale.total, 0);
        const fiado = sales.filter(s => s.tipo === 'FIADO').reduce((s, sale) => s + sale.total, 0);
        const aberto = debts.reduce((s, d) => s + d.saldo, 0);
        const lowStock = prods.filter(p => p.estoque <= p.alerta);
        
        setData({ vendas: sales.length, total, pago, fiado, aberto, debitos: debts.length, lowStock });
        setLoading(false);
    };
    
    if (loading) return <div className="flex justify-center p-12"><div className="loading-spinner"></div></div>;
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { t: 'Total Vendido', v: `R$ ${data.total.toFixed(2)}`, i: '💰', c: 'green' },
                    { t: 'Vendas', v: data.vendas, i: '🛒', c: 'orange' },
                    { t: 'Em Fiado', v: `R$ ${data.aberto.toFixed(2)}`, i: '⚠️', c: 'red' },
                    { t: 'Débitos', v: data.debitos, i: '👥', c: 'purple' }
                ].map((s, i) => (
                    <div key={i} className="card">
                        <p className="text-sm text-gray-600">{s.t}</p>
                        <p className="text-2xl font-bold mt-2">{s.v}</p>
                    </div>
                ))}
            </div>
            {data.lowStock.length > 0 && (
                <div className="card">
                    <h3 className="font-bold mb-3">⚠️ Produtos com Estoque Baixo</h3>
                    <div className="space-y-2">
                        {data.lowStock.map(p => (
                            <div key={p.id} className="flex justify-between p-3 bg-red-50 rounded-lg">
                                <span>{p.nome}</span>
                                <span className="font-bold text-red-600">{p.estoque} un.</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

console.log('✓ Dashboard carregado');

// CLIENTES
const Clientes = () => {
    const [list, setList] = useState([]);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [details, setDetails] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ nome: '', turma: '', contato: '', foto: null, pai: {nome:'',contato:''}, mae: {nome:'',contato:''}, obs: '', bloqueado: false });
    const toast = useToast();
    
    useEffect(() => { load(); }, []);
    
    const load = async () => {
        const data = await db.getAll('children');
        setList(data.sort((a,b) => a.nome.localeCompare(b.nome)));
    };
    
    const filtered = search ? list.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.turma.toLowerCase().includes(search.toLowerCase())) : list;
    
    const save = async (e) => {
        e.preventDefault();
        try {
            if (selected) {
                await db.put('children', {...form, id: selected.id});
                toast.showToast('Cliente atualizado!');
            } else {
                await db.add('children', {...form, id: generateId()});
                toast.showToast('Cliente cadastrado!');
            }
            setModal(false);
            reset();
            load();
        } catch (err) { toast.showToast('Erro ao salvar', 'error'); }
    };
    
    const del = async (id) => {
        if (!confirm('Excluir cliente?')) return;
        await db.delete('children', id);
        toast.showToast('Cliente excluído!');
        load();
    };
    
    const edit = (c) => { setSelected(c); setForm(c); setModal(true); };
    const reset = () => { setForm({ nome: '', turma: '', contato: '', foto: null, pai: {nome:'',contato:''}, mae: {nome:'',contato:''}, obs: '', bloqueado: false }); setSelected(null); };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Clientes</h2>
                <button onClick={() => setModal(true)} className="btn btn-primary">➕ Novo</button>
            </div>
            <input type="text" placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(c => (
                    <div key={c.id} className="card">
                        <div className="flex items-start gap-3 mb-3">
                            {c.foto ? <img src={c.foto} className="w-16 h-16 rounded-full object-cover" /> :
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                                    {getInitials(c.nome)}
                                </div>
                            }
                            <div className="flex-1">
                                <h3 className="font-bold">{c.nome}</h3>
                                <p className="text-sm text-gray-600">{c.turma}</p>
                                {c.bloqueado && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full mt-1 inline-block">🚫 Bloqueado</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setDetails(c)} className="flex-1 btn bg-gray-100 text-sm py-2">👁️ Ver</button>
                            <button onClick={() => edit(c)} className="btn bg-blue-100 text-sm py-2">✏️</button>
                            <button onClick={() => del(c.id)} className="btn bg-red-100 text-sm py-2">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
            
            <Modal isOpen={modal} onClose={() => { setModal(false); reset(); }} title={selected ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
                <form onSubmit={save} className="space-y-4">
                    <ImgUpload img={form.foto} onChange={f => setForm({...form, foto: f})} label="Foto (opcional)" icon="👤" />
                    <input type="text" placeholder="Nome completo *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Turma *" value={form.turma} onChange={e => setForm({...form, turma: e.target.value})} required />
                        <input type="tel" placeholder="Contato" value={form.contato} onChange={e => setForm({...form, contato: e.target.value})} />
                    </div>
                    <div className="border-t pt-4">
                        <h4 className="font-bold mb-3">Responsáveis</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Nome do Pai" value={form.pai.nome} onChange={e => setForm({...form, pai: {...form.pai, nome: e.target.value}})} />
                            <input type="tel" placeholder="Contato do Pai" value={form.pai.contato} onChange={e => setForm({...form, pai: {...form.pai, contato: e.target.value}})} />
                            <input type="text" placeholder="Nome da Mãe" value={form.mae.nome} onChange={e => setForm({...form, mae: {...form.mae, nome: e.target.value}})} />
                            <input type="tel" placeholder="Contato da Mãe" value={form.mae.contato} onChange={e => setForm({...form, mae: {...form.mae, contato: e.target.value}})} />
                        </div>
                    </div>
                    <textarea placeholder="Observações" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} rows="2" />
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.bloqueado} onChange={e => setForm({...form, bloqueado: e.target.checked})} />
                        <span className="text-red-600 font-semibold">🚫 Bloquear fiado</span>
                    </label>
                    <div className="flex gap-3">
                        <button type="submit" className="flex-1 btn btn-primary">{selected ? 'Atualizar' : 'Cadastrar'}</button>
                        <button type="button" onClick={() => { setModal(false); reset(); }} className="flex-1 btn bg-gray-200">Cancelar</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={!!details} onClose={() => setDetails(null)} title="Detalhes do Cliente">
                {details && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                            {details.foto ? <img src={details.foto} className="w-20 h-20 rounded-full object-cover" /> :
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {getInitials(details.nome)}
                                </div>
                            }
                            <div>
                                <h3 className="text-xl font-bold">{details.nome}</h3>
                                <p className="text-gray-600">{details.turma}</p>
                            </div>
                        </div>
                        <div><p className="text-sm text-gray-600">Contato</p><p className="font-bold">{details.contato || '-'}</p></div>
                        <div className="border-t pt-4">
                            <h4 className="font-bold mb-3">Responsáveis</h4>
                            <div className="space-y-2">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Pai</p>
                                    <p>{details.pai?.nome || '-'}</p>
                                    <p className="text-sm">{details.pai?.contato || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Mãe</p>
                                    <p>{details.mae?.nome || '-'}</p>
                                    <p className="text-sm">{details.mae?.contato || '-'}</p>
                                </div>
                            </div>
                        </div>
                        {details.obs && <div><p className="text-sm text-gray-600">Observações</p><p>{details.obs}</p></div>}
                    </div>
                )}
            </Modal>
        </div>
    );
};

console.log('✓ Clientes carregado');

// PRODUTOS - Página completa com upload de imagem
const Produtos = () => {
    const [list, setList] = useState([]);
    const [modal, setModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({nome:'', categoria:'Salgado', preco:'', estoque:'', alerta:5, imagem:null});
    const toast = useToast();
    
    useEffect(() => { load(); }, []);
    const load = async () => setList(await db.getAll('products'));
    
    const save = async (e) => {
        e.preventDefault();
        try {
            const data = {...form, preco: parseFloat(form.preco), estoque: parseInt(form.estoque), alerta: parseInt(form.alerta)};
            selected ? await db.put('products', {...data, id: selected.id}) : await db.add('products', {...data, id: generateId()});
            toast.showToast('Produto salvo!');
            setModal(false);
            setForm({nome:'', categoria:'Salgado', preco:'', estoque:'', alerta:5, imagem:null});
            setSelected(null);
            load();
        } catch (err) { toast.showToast('Erro', 'error'); }
    };
    
    const del = async (id) => { if (confirm('Excluir?')) { await db.delete('products', id); toast.showToast('Excluído!'); load(); } };
    const edit = (p) => { setSelected(p); setForm(p); setModal(true); };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between"><h2 className="text-3xl font-bold">Produtos</h2><button onClick={() => setModal(true)} className="btn btn-primary">➕ Novo</button></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {list.map(p => (
                    <div key={p.id} className={`card text-center ${p.estoque <= p.alerta ? 'border-2 border-red-300' : ''}`}>
                        {p.imagem ? <img src={p.imagem} className="w-full h-32 object-cover rounded-xl mb-3" /> :
                            <div className={`w-full h-32 rounded-xl flex items-center justify-center text-5xl mb-3 ${getCategoryColor(p.categoria)}`}>{getCategoryIcon(p.categoria)}</div>
                        }
                        <h3 className="font-bold">{p.nome}</h3>
                        <p className="text-sm text-gray-600">{p.categoria}</p>
                        <p className="text-xl font-bold text-green-600 my-2">R$ {p.preco.toFixed(2)}</p>
                        <p className={`text-sm ${p.estoque <= p.alerta ? 'text-red-600 font-bold' : 'text-gray-600'}`}>Estoque: {p.estoque}</p>
                        <div className="flex gap-2 mt-3">
                            <button onClick={() => edit(p)} className="flex-1 btn bg-blue-100 text-sm py-2">✏️</button>
                            <button onClick={() => del(p.id)} className="flex-1 btn bg-red-100 text-sm py-2">🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
            <Modal isOpen={modal} onClose={() => { setModal(false); setForm({nome:'', categoria:'Salgado', preco:'', estoque:'', alerta:5, imagem:null}); setSelected(null); }} title={selected ? 'Editar Produto' : 'Novo Produto'}>
                <form onSubmit={save} className="space-y-4">
                    <ImgUpload img={form.imagem} onChange={i => setForm({...form, imagem: i})} label="Foto (opcional)" icon="📦" />
                    <input type="text" placeholder="Nome *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
                    <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                        {['Doce','Salgado','Bebida','Lanche','Outro'].map(c => <option key={c}>{c}</option>)}
                    </select>
                    <div className="grid grid-cols-3 gap-4">
                        <input type="number" step="0.01" placeholder="Preço *" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} required />
                        <input type="number" placeholder="Estoque *" value={form.estoque} onChange={e => setForm({...form, estoque: e.target.value})} required />
                        <input type="number" placeholder="Alerta" value={form.alerta} onChange={e => setForm({...form, alerta: e.target.value})} />
                    </div>
                    <div className="flex gap-3">
                        <button type="submit" className="flex-1 btn btn-primary">{selected ? 'Atualizar' : 'Cadastrar'}</button>
                        <button type="button" onClick={() => setModal(false)} className="flex-1 btn bg-gray-200">Cancelar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

// VENDAS (POS) - Sistema de ponto de venda
const Vendas = () => {
    const [prods, setProds] = useState([]);
    const [clients, setClients] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [searchClient, setSearchClient] = useState('');
    const [obs, setObs] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const toast = useToast();
    
    useEffect(() => { load(); }, []);
    const load = async () => { setProds(await db.getAll('products')); setClients(await db.getAll('children')); };
    
    const add = (p) => {
        const exist = cart.find(i => i.id === p.id);
        if (exist) {
            if (exist.qty >= p.estoque) { toast.showToast('Estoque insuficiente!', 'error'); return; }
            setCart(cart.map(i => i.id === p.id ? {...i, qty: i.qty + 1, sub: (i.qty + 1) * i.preco} : i));
        } else {
            if (p.estoque < 1) { toast.showToast('Sem estoque!', 'error'); return; }
            setCart([...cart, {id: p.id, nome: p.nome, qty: 1, preco: p.preco, sub: p.preco}]);
        }
        toast.showToast(`${p.nome} adicionado!`);
    };
    
    const updateQty = (id, qty) => {
        if (qty <= 0) { setCart(cart.filter(i => i.id !== id)); return; }
        const prod = prods.find(p => p.id === id);
        if (qty > prod.estoque) { toast.showToast('Estoque insuficiente!', 'error'); return; }
        setCart(cart.map(i => i.id === id ? {...i, qty, sub: qty * i.preco} : i));
    };
    
    const remove = (id) => setCart(cart.filter(i => i.id !== id));
    const selectClient = (c) => { setSelectedClient(c); setSearchClient(c.nome); setShowDropdown(false); };
    const clearClient = () => { setSelectedClient(null); setSearchClient(''); };
    const total = cart.reduce((s, i) => s + i.sub, 0);
    
    const finalize = async (tipo) => {
        if (cart.length === 0) { toast.showToast('Carrinho vazio!', 'error'); return; }
        if (tipo === 'FIADO' && !selectedClient) { toast.showToast('Selecione um cliente para fiado!', 'error'); return; }
        if (tipo === 'FIADO' && selectedClient?.bloqueado) { toast.showToast('Cliente bloqueado para fiado!', 'error'); return; }
        
        try {
            const sale = {id: generateId(), cliente_id: selectedClient?.id, cliente_nome: selectedClient?.nome, itens: cart, total, tipo, obs, data: new Date().toISOString()};
            await db.add('sales', sale);
            
            for (const item of cart) {
                const prod = await db.get('products', item.id);
                await db.put('products', {...prod, estoque: prod.estoque - item.qty});
            }
            
            if (tipo === 'FIADO' && selectedClient) {
                const debt = await db.get('debts', selectedClient.id);
                if (debt) {
                    await db.put('debts', {...debt, saldo: debt.saldo + total, vendas: [...debt.vendas, sale.id]});
                } else {
                    await db.add('debts', {crianca_id: selectedClient.id, nome: selectedClient.nome, saldo: total, vendas: [sale.id]});
                }
            }
            
            toast.showToast(`Venda ${tipo} registrada!`);
            setCart([]);
            clearClient();
            setObs('');
            load();
        } catch (err) { toast.showToast('Erro ao registrar venda!', 'error'); }
    };
    
    const filteredClients = searchClient ? clients.filter(c => c.nome.toLowerCase().includes(searchClient.toLowerCase())) : [];
    
    return (
        <div className="grid grid-cols-12 gap-4" style={{height: 'calc(100vh - 200px)'}}>
            <div className="col-span-8 space-y-4 overflow-y-auto">
                <h2 className="text-3xl font-bold">Vendas</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {prods.map(p => (
                        <button key={p.id} onClick={() => p.estoque > 0 && add(p)} disabled={p.estoque === 0}
                                className={`p-4 rounded-2xl transition-all ${p.estoque === 0 ? 'opacity-40' : 'hover:scale-105 active:scale-95'} ${getCategoryColor(p.categoria)} border-2`}>
                            {p.imagem ? <img src={p.imagem} className="w-full h-20 object-cover rounded-xl mb-2" /> :
                                <div className="text-4xl mb-2">{getCategoryIcon(p.categoria)}</div>
                            }
                            <p className="font-bold text-sm">{p.nome}</p>
                            <p className="text-lg font-bold text-green-600">R$ {p.preco.toFixed(2)}</p>
                            <p className="text-xs text-gray-600">{p.estoque === 0 ? 'Sem estoque' : `Est: ${p.estoque}`}</p>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="col-span-4 bg-white rounded-3xl shadow-xl p-4 flex flex-col" style={{height: 'calc(100vh - 200px)'}}>
                <h3 className="text-xl font-bold mb-4">🛒 Carrinho</h3>
                <div className="relative mb-4">
                    <input type="text" placeholder="🔍 Cliente (opcional)" value={searchClient} onChange={e => { setSearchClient(e.target.value); setShowDropdown(true); }}
                           onFocus={() => setShowDropdown(true)} className="w-full" />
                    {selectedClient && <button onClick={clearClient} className="absolute right-3 top-3">❌</button>}
                    {showDropdown && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            {filteredClients.map(c => (
                                <button key={c.id} onClick={() => selectClient(c)} className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-0">
                                    <p className="font-semibold">{c.nome}</p>
                                    <p className="text-sm text-gray-500">{c.turma}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {selectedClient && (
                    <div className="mb-4 p-3 bg-orange-50 rounded-xl">
                        <p className="font-semibold">{selectedClient.nome}</p>
                        <p className="text-sm text-gray-600">{selectedClient.turma}</p>
                        {selectedClient.bloqueado && <span className="text-xs text-red-600">🚫 Bloqueado</span>}
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {cart.length === 0 ? <div className="text-center text-gray-400 py-8">Carrinho vazio</div> :
                        cart.map(i => (
                            <div key={i.id} className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-semibold flex-1">{i.nome}</p>
                                    <button onClick={() => remove(i.id)} className="text-red-600">❌</button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <button onClick={() => updateQty(i.id, i.qty - 1)} className="w-8 h-8 rounded-full bg-white border">-</button>
                                        <span className="w-8 text-center font-bold">{i.qty}</span>
                                        <button onClick={() => updateQty(i.id, i.qty + 1)} className="w-8 h-8 rounded-full bg-white border">+</button>
                                    </div>
                                    <p className="font-bold">R$ {i.sub.toFixed(2)}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
                
                <input type="text" placeholder="Observação" value={obs} onChange={e => setObs(e.target.value)} className="mb-4" />
                <div className="bg-orange-50 p-4 rounded-xl mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">TOTAL</span>
                        <span className="text-2xl font-bold text-orange-600">R$ {total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <button onClick={() => finalize('PAGO')} disabled={cart.length === 0} className="w-full btn btn-success py-3 text-lg">✓ PAGO</button>
                    <button onClick={() => finalize('FIADO')} disabled={cart.length === 0} className="w-full btn btn-danger py-3 text-lg">💳 FIADO</button>
                </div>
            </div>
        </div>
    );
};

console.log('✓ Produtos e Vendas carregados');

// FIADOS
const Fiados = () => {
    const [list, setList] = useState([]);
    const [modal, setModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [valor, setValor] = useState('');
    const toast = useToast();
    
    useEffect(() => { load(); }, []);
    const load = async () => setList((await db.getAll('debts')).filter(d => d.saldo > 0));
    
    const pay = async () => {
        const v = parseFloat(valor);
        if (!v || v <= 0 || v > selected.saldo) { toast.showToast('Valor inválido!', 'error'); return; }
        await db.put('debts', {...selected, saldo: selected.saldo - v});
        toast.showToast('Pagamento registrado!');
        setModal(false);
        setValor('');
        load();
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold">Controle de Fiados</h2>
            <div className="card bg-red-50"><p className="text-sm text-red-600">Total em Aberto</p><p className="text-2xl font-bold text-red-600">R$ {list.reduce((s,d) => s + d.saldo, 0).toFixed(2)}</p></div>
            {list.length === 0 ? <div className="card text-center py-12"><p className="text-5xl mb-4">✅</p><p className="text-lg text-gray-500">Nenhum débito pendente!</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map(d => (
                        <div key={d.crianca_id} className="card bg-red-50">
                            <h3 className="font-bold text-lg mb-2">{d.nome}</h3>
                            <div className="bg-white p-3 rounded-xl mb-3">
                                <div className="flex justify-between"><span className="text-sm">Saldo:</span><span className="text-xl font-bold text-red-600">R$ {d.saldo.toFixed(2)}</span></div>
                            </div>
                            <button onClick={() => { setSelected(d); setValor(d.saldo.toFixed(2)); setModal(true); }} className="w-full btn btn-success">💰 Dar Baixa</button>
                        </div>
                    ))}
                </div>
            }
            <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Pagamento">
                {selected && (
                    <div className="space-y-4">
                        <div className="card bg-orange-50"><p className="font-bold">{selected.nome}</p><p className="text-2xl font-bold text-red-600">R$ {selected.saldo.toFixed(2)}</p></div>
                        <input type="number" step="0.01" placeholder="Valor do pagamento" value={valor} onChange={e => setValor(e.target.value)} />
                        <div className="flex gap-3">
                            <button onClick={pay} className="flex-1 btn btn-success">✓ Confirmar</button>
                            <button onClick={() => setModal(false)} className="flex-1 btn bg-gray-200">Cancelar</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// RELATÓRIOS
const Relatorios = () => {
    const [inicio, setInicio] = useState('');
    const [fim, setFim] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState(null);
    const toast = useToast();
    
    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        setInicio(d.toISOString().split('T')[0]);
    }, []);
    
    useEffect(() => { if (inicio && fim) load(); }, [inicio, fim]);
    
    const load = async () => {
        const sales = await db.getAll('sales');
        const filtered = sales.filter(s => s.data >= new Date(inicio).toISOString() && s.data <= new Date(fim + 'T23:59:59').toISOString());
        const total = filtered.reduce((s, sale) => s + sale.total, 0);
        const pago = filtered.filter(s => s.tipo === 'PAGO').reduce((s, sale) => s + sale.total, 0);
        const fiado = filtered.filter(s => s.tipo === 'FIADO').reduce((s, sale) => s + sale.total, 0);
        setData({vendas: filtered.length, total, pago, fiado});
    };
    
    const exportExcel = () => {
        if (!data) return;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
            ['RELATÓRIO DE VENDAS'],
            ['Período', `${new Date(inicio).toLocaleDateString('pt-BR')} até ${new Date(fim).toLocaleDateString('pt-BR')}`],
            [],
            ['Total de Vendas', data.vendas],
            ['Total Vendido', `R$ ${data.total.toFixed(2)}`],
            ['Total Pago', `R$ ${data.pago.toFixed(2)}`],
            ['Total Fiado', `R$ ${data.fiado.toFixed(2)}`]
        ]);
        XLSX.utils.book_append_sheet(wb, ws, 'Resumo');
        XLSX.writeFile(wb, `relatorio_${inicio}_${fim}.xlsx`);
        toast.showToast('Excel exportado!');
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold">Relatórios</h2>
            <div className="card">
                <h3 className="font-bold mb-3">📅 Período</h3>
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
                    <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
                </div>
            </div>
            {data && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[{t:'Vendas', v:data.vendas, i:'🛒'}, {t:'Total', v:`R$ ${data.total.toFixed(2)}`, i:'💰'}, 
                          {t:'Pago', v:`R$ ${data.pago.toFixed(2)}`, i:'✓'}, {t:'Fiado', v:`R$ ${data.fiado.toFixed(2)}`, i:'💳'}].map((s,i) => (
                            <div key={i} className="card"><p className="text-sm text-gray-600">{s.t}</p><p className="text-2xl font-bold mt-2">{s.v}</p></div>
                        ))}
                    </div>
                    <button onClick={exportExcel} className="btn btn-success">📊 Exportar Excel</button>
                </>
            )}
        </div>
    );
};

// CONFIG
const Config = () => {
    const toast = useToast();
    
    const backup = async () => {
        const data = {
            children: await db.getAll('children'),
            products: await db.getAll('products'),
            sales: await db.getAll('sales'),
            debts: await db.getAll('debts'),
            date: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.showToast('Backup criado!');
    };
    
    const restore = async (e) => {
        const file = e.target.files[0];
        if (!file || !confirm('ATENÇÃO: Isso irá SUBSTITUIR todos os dados atuais. Continuar?')) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                await db.clear('children');
                await db.clear('products');
                await db.clear('sales');
                await db.clear('debts');
                for (const c of data.children || []) await db.add('children', c);
                for (const p of data.products || []) await db.add('products', p);
                for (const s of data.sales || []) await db.add('sales', s);
                for (const d of data.debts || []) await db.add('debts', d);
                toast.showToast('Backup restaurado!');
                setTimeout(() => window.location.reload(), 2000);
            } catch (err) { toast.showToast('Erro ao restaurar!', 'error'); }
        };
        reader.readAsText(file);
    };
    
    const seed = async () => {
        if (!confirm('Criar dados de exemplo?')) return;
        const result = await seedData();
        toast.showToast(result.message, result.success ? 'success' : 'error');
        if (result.success) setTimeout(() => window.location.reload(), 2000);
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold">Configurações</h2>
            <div className="card">
                <h3 className="font-bold mb-3">💾 Backup e Restauração</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={backup} className="btn btn-success">📥 Fazer Backup</button>
                    <label className="btn bg-orange-500 text-white text-center cursor-pointer">
                        📤 Restaurar Backup
                        <input type="file" accept=".json" onChange={restore} className="hidden" />
                    </label>
                </div>
            </div>
            <div className="card">
                <h3 className="font-bold mb-3">🎯 Dados de Exemplo</h3>
                <button onClick={seed} className="btn bg-purple-500 text-white">➕ Criar Dados de Exemplo</button>
            </div>
        </div>
    );
};

// SUPORTE
const Suporte = () => {
    const whatsapp = '5567999847546';
    const msg = encodeURIComponent('Olá Leonel, preciso de suporte com o Sistema de Vendas Lanchonete...');
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Suporte</h2>
            <div className="card text-center py-12">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-6xl mx-auto mb-6">👨‍💻</div>
                <h3 className="text-2xl font-bold mb-2">Leonel Souza</h3>
                <p className="text-gray-600 mb-6">Desenvolvedor do Sistema</p>
                <a href={`https://wa.me/${whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-3 btn btn-success text-xl px-8 py-4">
                    <span className="text-3xl">💬</span>
                    WhatsApp: (67) 9.99847-7546
                </a>
                <p className="text-sm text-gray-500 mt-6">Clique para abrir conversa no WhatsApp</p>
            </div>
            <div className="card">
                <h3 className="font-bold mb-3">📖 Sobre o Sistema</h3>
                <p className="text-gray-600 mb-2">Sistema de Vendas Lanchonete v1.0</p>
                <p className="text-gray-600 mb-2">✅ 100% Offline - Funciona sem internet</p>
                <p className="text-gray-600 mb-2">💾 Dados salvos localmente no navegador</p>
                <p className="text-gray-600">🔒 Nenhum dado é enviado para internet</p>
            </div>
        </div>
    );
};

// APP PRINCIPAL
const App = () => {
    const [page, setPage] = useState('dash');
    const [ready, setReady] = useState(false);
    
    useEffect(() => {
        db.init().then(() => {
            console.log('✓ Sistema inicializado');
            setReady(true);
        }).catch(err => {
            console.error('Erro ao inicializar:', err);
            alert('Erro ao inicializar o banco de dados!');
        });
    }, []);
    
    if (!ready) return <div className="flex items-center justify-center h-screen"><div className="loading-spinner"></div></div>;
    
    const pages = {
        dash: Dashboard,
        vendas: Vendas,
        clientes: Clientes,
        produtos: Produtos,
        fiados: Fiados,
        relatorios: Relatorios,
        config: Config,
        suporte: Suporte
    };
    
    const PageComponent = pages[page] || Dashboard;
    
    return (
        <ToastProvider>
            <Layout page={page} onNav={setPage}>
                <PageComponent />
            </Layout>
        </ToastProvider>
    );
};

// INICIALIZAÇÃO
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando sistema...');
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
    console.log('✓ Sistema carregado com sucesso!');
});

