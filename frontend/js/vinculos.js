// Cache local dos vínculos para evitar requisições desnecessárias ao filtrar
let dadosVinculos = [];

// Busca todos os vínculos promotor-loja da API
async function carregarVinculos() {
    try {
        const res = await fetch(`${API_URL}/admin/vinculos`);
        dadosVinculos = await res.json();
        filtrarVinculos();
    } catch(e) { console.error("Erro ao carregar vínculos"); }
}

// Filtra a lista em memória pelo nome do promotor e pelo nome da loja
function filtrarVinculos() {
    const termoVend = document.getElementById('filtro-vinculo-vend').value.toLowerCase();
    const termoLoja = document.getElementById('filtro-vinculo-loja').value.toLowerCase();

    const listaFiltrada = dadosVinculos.filter(v => {
        return v.vendedor_nome.toLowerCase().includes(termoVend) &&
               v.loja_nome.toLowerCase().includes(termoLoja);
    });
    renderizarVinculos(listaFiltrada);
}

// Monta as linhas da tabela de vínculos a partir de uma lista filtrada
function renderizarVinculos(lista) {
    const tbody = document.getElementById('tabela-vinculos');
    tbody.innerHTML = '';

    lista.forEach(v => {
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b">
                <td class="p-3 font-medium text-gray-800">👤 ${v.vendedor_nome}</td>
                <td class="p-3 text-gray-700">📍 ${v.loja_nome}</td>
                <td class="p-3 text-center">
                    <button type="button" onclick="removerVinculo(${v.vendedor_id}, ${v.loja_id})"
                            class="text-red-500 hover:text-red-700 font-bold text-sm">
                        🗑️ Remover Rota
                    </button>
                </td>
            </tr>
        `;
    });
}

// Carrega os selects de promotores e lojas ativos antes de exibir a aba de vínculos
async function carregarSelectsParaVinculo() {
    const [resVend, resLoj] = await Promise.all([
        fetch(`${API_URL}/admin/vendedores`),
        fetch(`${API_URL}/admin/lojas`)
    ]);

    const vendedores = await resVend.json();
    const lojas = await resLoj.json();

    const selVend = document.getElementById('select-vendedor');
    const selLoj = document.getElementById('select-loja');

    // Exibe apenas promotores e lojas ativos nos selects de criação de rota
    selVend.innerHTML = vendedores.filter(v => v.ativo).map(v => `<option value="${v.id}">${v.nome}</option>`).join('');
    selLoj.innerHTML = lojas.filter(l => l.ativo).map(l => `<option value="${l.id}">${l.nome_fantasia}</option>`).join('');

    carregarVinculos();
}

// Cria um novo vínculo entre o promotor e a loja selecionados
async function salvarVinculo() {
    const fd = new FormData();
    fd.append('vendedor_id', document.getElementById('select-vendedor').value);
    fd.append('loja_id', document.getElementById('select-loja').value);

    const res = await fetch(`${API_URL}/admin/vinculos`, { method: 'POST', body: fd });
    if(res.ok) {
        carregarVinculos();
        alert('Vínculo criado!');
    }
}

// Remove a rota entre um promotor e uma loja após confirmação do usuário
async function removerVinculo(vId, lId) {
    if(!confirm("Tem certeza que deseja remover este vendedor desta loja?")) return;

    try {
        const res = await fetch(`${API_URL}/admin/vinculos/${vId}/${lId}`, { method: 'DELETE' });
        if(res.ok) carregarVinculos();
    } catch(e) { alert("Erro ao remover vínculo."); }
}