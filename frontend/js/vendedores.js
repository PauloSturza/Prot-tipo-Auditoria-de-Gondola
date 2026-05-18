// Cache local dos promotores para evitar requisições desnecessárias ao filtrar
let dadosVendedores = [];

// Busca todos os promotores da API e popula o autocomplete do filtro
async function carregarVendedores() {
    try {
        const res = await fetch(`${API_URL}/admin/vendedores`);
        dadosVendedores = await res.json();

        const datalist = document.getElementById('lista-nomes-vend');
        const nomesUnicos = [...new Set(dadosVendedores.map(v => v.nome))];
        datalist.innerHTML = nomesUnicos.map(nome => `<option value="${nome}">`).join('');

        filtrarVendedores();
    } catch(e) { console.error("Erro ao carregar vendedores"); }
}

// Filtra a lista em memória pelo nome digitado e pelo status selecionado
function filtrarVendedores() {
    const termoNome = document.getElementById('filtro-nome-vend').value.toLowerCase();
    const status = document.getElementById('filtro-status-vend').value;

    const listaFiltrada = dadosVendedores.filter(v => {
        const bateNome = v.nome.toLowerCase().includes(termoNome);
        let bateStatus = true;
        if (status === 'ativos') bateStatus = v.ativo === true;
        if (status === 'inativos') bateStatus = v.ativo === false;
        return bateNome && bateStatus;
    });
    renderizarVendedores(listaFiltrada);
}

// Monta as linhas da tabela de promotores a partir de uma lista filtrada
function renderizarVendedores(lista) {
    const tbody = document.getElementById('tabela-vendedores');
    tbody.innerHTML = '';

    lista.forEach(v => {
        const menuId = `menu-vend-${v.id}`;
        tbody.innerHTML += `
            <tr class="hover:bg-gray-50 border-b relative">
                <td class="p-3">${v.id}</td>
                <td class="p-3 font-medium">${v.nome}</td>
                <td class="p-3 text-gray-600">${v.email}</td>
                <td class="p-3 flex items-center mt-1">
                    ${renderizarStatus(v.ativo)} ${v.ativo ? 'Ativo' : 'Inativo'}
                </td>
                <td class="p-3 text-center">
                    <button type="button" onclick="toggleMenu('${menuId}')" class="text-gray-500 hover:text-gray-800 p-2 rounded">⚙️ Ações</button>
                    <div id="${menuId}" class="menu-acao hidden absolute right-8 mt-2 w-32 bg-white rounded-md shadow-xl border border-gray-200 z-10">
                        <button type="button" onclick="alterarStatusVendedor(${v.id}, ${!v.ativo})" class="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-semibold">
                            ${v.ativo ? '🔴 Desativar' : '🟢 Ativar'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Envia o formulário de cadastro e recarrega a tabela em caso de sucesso
async function salvarVendedor() {
    const fd = new FormData();
    fd.append('nome', document.getElementById('vend-nome').value);
    fd.append('email', document.getElementById('vend-email').value);
    fd.append('senha', document.getElementById('vend-senha').value);

    try {
        const res = await fetch(`${API_URL}/admin/vendedores`, { method: 'POST', body: fd });
        if(res.ok) {
            document.getElementById('form-vendedor').reset();
            carregarVendedores();
        } else {
            alert('Erro ao cadastrar vendedor.');
        }
    } catch(e) {
        alert('Erro de conexão com o servidor.');
    }
}

// Ativa ou desativa um promotor e atualiza a tabela
async function alterarStatusVendedor(id, novoStatus) {
    try {
        const res = await fetch(`${API_URL}/admin/vendedores/${id}/toggle?ativo=${novoStatus}`, { method: 'PUT' });
        if (res.ok) {
            await carregarVendedores();
        } else {
            alert(`Erro no Servidor: A rota falhou.`);
        }
    } catch (e) { alert(`Erro de conexão com o backend.`); }
}