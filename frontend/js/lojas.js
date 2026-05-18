// Cache local das lojas para evitar requisições desnecessárias ao filtrar
let dadosLojas = [];

// Busca todas as lojas da API e popula os autocompletes de loja e promotor
async function carregarLojas() {
    try {
        const res = await fetch(`${API_URL}/admin/lojas`);
        dadosLojas = await res.json();

        const datalistLojas = document.getElementById('lista-nomes-lojas');
        const nomesLojas = [...new Set(dadosLojas.map(l => l.nome_fantasia))];
        datalistLojas.innerHTML = nomesLojas.map(nome => `<option value="${nome}">`).join('');

        // Extrai os nomes dos promotores da string agregada que vem do backend
        const datalistPromotores = document.getElementById('lista-nomes-promotores');
        let todosPromotores = [];
        dadosLojas.forEach(l => {
            if(l.promotores && l.promotores !== 'Nenhum Promotor') {
                todosPromotores.push(...l.promotores.split(', '));
            }
        });
        const promotoresUnicos = [...new Set(todosPromotores)];
        datalistPromotores.innerHTML = promotoresUnicos.map(p => `<option value="${p}">`).join('');

        filtrarLojas();
    } catch(e) { console.error("Erro ao carregar lojas"); }
}

// Filtra a lista em memória por nome, promotor vinculado e status
function filtrarLojas() {
    const termoNome = document.getElementById('filtro-nome-loja').value.toLowerCase();
    const termoPromotor = document.getElementById('filtro-promotor-loja').value.toLowerCase();
    const status = document.getElementById('filtro-status-loja').value;

    const listaFiltrada = dadosLojas.filter(l => {
        const bateNome = l.nome_fantasia.toLowerCase().includes(termoNome);
        const stringPromotores = l.promotores ? l.promotores.toLowerCase() : "";
        const batePromotor = stringPromotores.includes(termoPromotor);
        let bateStatus = true;
        if (status === 'ativas') bateStatus = l.ativo === true;
        if (status === 'inativas') bateStatus = l.ativo === false;
        return bateNome && batePromotor && bateStatus;
    });
    renderizarLojas(listaFiltrada);
}

// Monta as linhas da tabela de lojas a partir de uma lista filtrada
function renderizarLojas(lista) {
    const tbody = document.getElementById('tabela-lojas');
    tbody.innerHTML = '';

    lista.forEach(l => {
        const menuId = `menu-loja-${l.id}`;
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b relative">
                <td class="p-3">${l.id}</td>
                <td class="p-3 font-medium">${l.nome_fantasia}</td>
                <td class="p-3 text-xs text-gray-500">Lat: ${l.lat_loja} <br> Lng: ${l.lng_loja}</td>
                <td class="p-3 text-sm text-blue-700 font-semibold">${l.promotores}</td>
                <td class="p-3 flex items-center mt-1">
                    ${renderizarStatus(l.ativo)} ${l.ativo ? 'Ativa' : 'Inativa'}
                </td>
                <td class="p-3 text-center">
                    <button type="button" onclick="toggleMenu('${menuId}')" class="text-gray-500 hover:text-gray-800 p-2 rounded">⚙️ Ações</button>
                    <div id="${menuId}" class="menu-acao hidden absolute right-8 mt-2 w-32 bg-white rounded-md shadow-xl border border-gray-200 z-10">
                        <button type="button" onclick="alterarStatusLoja(${l.id}, ${!l.ativo})" class="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-semibold">
                            ${l.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Envia o formulário de cadastro de loja e recarrega a tabela em caso de sucesso
async function salvarLoja() {
    const fd = new FormData();
    fd.append('nome', document.getElementById('loja-nome').value);
    fd.append('lat', document.getElementById('loja-lat').value);
    fd.append('lng', document.getElementById('loja-lng').value);

    const res = await fetch(`${API_URL}/admin/lojas`, { method: 'POST', body: fd });
    if(res.ok) {
        document.getElementById('form-loja').reset();
        carregarLojas();
    }
}

// Ativa ou desativa uma loja e atualiza a tabela
async function alterarStatusLoja(id, novoStatus) {
    try {
        const res = await fetch(`${API_URL}/admin/lojas/${id}/toggle?ativo=${novoStatus}`, { method: 'PUT' });
        if (res.ok) {
            await carregarLojas();
        } else {
            alert(`Erro no Servidor: A rota falhou.`);
        }
    } catch (e) { alert(`Erro de conexão com o backend.`); }
}