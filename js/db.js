// IndexedDB Wrapper para Sistema de Vendas
class Database {
    constructor() {
        this.dbName = 'SistemaVendasDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✓ Banco de dados iniciado');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crianças/Clientes
                if (!db.objectStoreNames.contains('children')) {
                    db.createObjectStore('children', { keyPath: 'id' });
                }
                
                // Produtos
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                
                // Vendas
                if (!db.objectStoreNames.contains('sales')) {
                    db.createObjectStore('sales', { keyPath: 'id' });
                }
                
                // Débitos/Fiados
                if (!db.objectStoreNames.contains('debts')) {
                    db.createObjectStore('debts', { keyPath: 'crianca_id' });
                }
                
                // Configurações
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'key' });
                }
                
                console.log('✓ Estrutura do banco criada');
            };
        });
    }

    async getAll(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, id) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async count(storeName) {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Instância global do banco
const db = new Database();

// Funções auxiliares
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const resizeImage = (file, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Arquivo inválido'));
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Imagem muito grande (máx 5MB)'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getCategoryIcon = (category) => {
    const icons = {
        'Doce': '🍰',
        'Salgado': '🥐',
        'Bebida': '🥤',
        'Lanche': '🍔',
        'Outro': '🍽️'
    };
    return icons[category] || '🍽️';
};

const getCategoryColor = (category) => {
    const colors = {
        'Doce': 'bg-pink-100 border-pink-300',
        'Salgado': 'bg-yellow-100 border-yellow-300',
        'Bebida': 'bg-blue-100 border-blue-300',
        'Lanche': 'bg-green-100 border-green-300',
        'Outro': 'bg-gray-100 border-gray-300'
    };
    return colors[category] || 'bg-gray-100 border-gray-300';
};

// Seed Data - Dados de exemplo
const seedData = async () => {
    try {
        const childCount = await db.count('children');
        if (childCount > 0) {
            return { success: false, message: 'Dados já existem no sistema' };
        }

        // Crianças de exemplo
        const children = [
            { id: generateId(), nome: 'Ana Silva', turma: '3º Ano A', contato: '(67) 98765-4321', foto: null, pai: { nome: 'Pai de Ana', contato: '(67) 98765-4321' }, mae: { nome: 'Mãe de Ana', contato: '(67) 98765-4322' }, observacoes: '', bloqueado_fiado: false },
            { id: generateId(), nome: 'Bruno Costa', turma: '4º Ano B', contato: '(67) 97654-3210', foto: null, pai: { nome: 'Pai de Bruno', contato: '(67) 97654-3210' }, mae: { nome: 'Mãe de Bruno', contato: '(67) 97654-3211' }, observacoes: '', bloqueado_fiado: false },
            { id: generateId(), nome: 'Carla Souza', turma: '2º Ano A', contato: '(67) 96543-2109', foto: null, pai: { nome: 'Pai de Carla', contato: '(67) 96543-2109' }, mae: { nome: 'Mãe de Carla', contato: '(67) 96543-2110' }, observacoes: '', bloqueado_fiado: false },
            { id: generateId(), nome: 'Daniel Lima', turma: '5º Ano C', contato: '(67) 95432-1098', foto: null, pai: { nome: 'Pai de Daniel', contato: '(67) 95432-1098' }, mae: { nome: 'Mãe de Daniel', contato: '(67) 95432-1099' }, observacoes: '', bloqueado_fiado: false },
            { id: generateId(), nome: 'Elena Martins', turma: '3º Ano B', contato: '(67) 94321-0987', foto: null, pai: { nome: 'Pai de Elena', contato: '(67) 94321-0987' }, mae: { nome: 'Mãe de Elena', contato: '(67) 94321-0988' }, observacoes: '', bloqueado_fiado: false },
        ];

        for (const child of children) {
            await db.add('children', child);
        }

        // Produtos de exemplo
        const products = [
            { id: generateId(), nome: 'Salgado de Carne', categoria: 'Salgado', preco: 3.50, estoque: 50, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Salgado de Queijo', categoria: 'Salgado', preco: 3.00, estoque: 45, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Pão de Queijo', categoria: 'Salgado', preco: 2.50, estoque: 60, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Brigadeiro', categoria: 'Doce', preco: 2.00, estoque: 40, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Beijinho', categoria: 'Doce', preco: 2.00, estoque: 35, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Coca-Cola Lata', categoria: 'Bebida', preco: 5.00, estoque: 30, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Suco Natural', categoria: 'Bebida', preco: 4.00, estoque: 25, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Água Mineral', categoria: 'Bebida', preco: 2.50, estoque: 50, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Sanduíche Natural', categoria: 'Lanche', preco: 6.00, estoque: 20, alerta_estoque: 5, imagem: null },
            { id: generateId(), nome: 'Bolo Caseiro', categoria: 'Doce', preco: 4.50, estoque: 15, alerta_estoque: 5, imagem: null },
        ];

        for (const product of products) {
            await db.add('products', product);
        }

        return { success: true, message: 'Dados de exemplo criados com sucesso!' };
    } catch (error) {
        console.error('Erro ao criar dados:', error);
        return { success: false, message: 'Erro ao criar dados de exemplo' };
    }
};
