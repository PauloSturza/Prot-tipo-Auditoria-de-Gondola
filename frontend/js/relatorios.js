// Busca as visitas na API e renderiza os cards na tela; filtra por data se preenchido
async function carregarVisitas() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;

    let url = `${API_URL}/admin/visitas`;
    if(inicio && fim) url += `?inicio=${inicio}&fim=${fim}`;

    try {
        const res = await fetch(url);
        const visitas = await res.json();

        const container = document.getElementById('lista-visitas');
        container.innerHTML = '';

        visitas.forEach(v => {
            const dataFormatada = new Date(v.data_hora).toLocaleString('pt-BR');
            const fotoUrl = `${API_URL}/${v.url_foto}`;

            container.innerHTML += `
                <div class="bg-white rounded-lg shadow-md border border-gray-200">
                    <img src="${fotoUrl}"
                         class="w-full h-48 object-contain bg-gray-200 rounded-t-lg transition-transform duration-300 origin-center hover:scale-[2.5] hover:z-50 relative cursor-zoom-in"
                         alt="Foto da Gôndola">
                    <div class="p-4">
                        <h4 class="font-bold text-lg text-gray-800">${v.loja}</h4>
                        <p class="text-sm text-gray-600 mb-2 flex items-center">Promotor: ${v.vendedor}</p>
                        <p class="text-xs text-gray-500 mb-4 flex items-center">${dataFormatada}</p>
                        <a href="https://www.google.com/maps?q=${v.lat_registro},${v.lng_registro}" target="_blank" class="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded transition">
                            Ver no Mapa
                        </a>
                    </div>
                </div>
            `;
        });
    } catch(e) {
        console.error("Erro ao carregar relatórios", e);
    }
}

// Abre o PDF de cobertura de PDVs em nova aba para download direto
function gerarPDFCobertura() {
    const inicio = document.getElementById('filtro-inicio').value;
    const fim = document.getElementById('filtro-fim').value;

    if(!inicio || !fim) {
        alert("Selecione o período de início e fim primeiro!");
        return;
    }

    window.open(`${API_URL}/admin/pdf-cobertura?inicio=${inicio}&fim=${fim}`, '_blank');
}