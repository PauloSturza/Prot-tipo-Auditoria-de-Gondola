// URL base da API — aponta para o servidor backend
const API_URL = 'https://laptop-0sg8i9hh.tail29f6cd.ts.net:8443';

// Retorna o HTML do indicador de status (bolinha verde ou vermelha)
function renderizarStatus(ativo) {
    const cor = ativo ? 'bg-green-500' : 'bg-red-500';
    return `<div class="w-4 h-4 ${cor} rounded shadow-sm inline-block mr-2"></div>`;
}

// Abre o menu de ações de uma linha e fecha os demais que estiverem abertos
function toggleMenu(menuId) {
    document.querySelectorAll('.menu-acao').forEach(m => {
        if(m.id !== menuId) m.classList.add('hidden');
    });
    const menu = document.getElementById(menuId);
    menu.classList.toggle('hidden');
}

// Troca a aba visível e carrega os dados correspondentes
function mudarAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(el => el.classList.add('hidden'));
    document.getElementById(`aba-${idAba}`).classList.remove('hidden');

    if(idAba === 'relatorios') carregarVisitas();
    if(idAba === 'vendedores') carregarVendedores();
    if(idAba === 'lojas') carregarLojas();
    if(idAba === 'vinculos') carregarSelectsParaVinculo();
}