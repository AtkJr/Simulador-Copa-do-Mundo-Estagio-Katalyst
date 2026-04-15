// ==========================================
// 1. CONFIGURAÇÕES INICIAIS
// ==========================================
const API_URL = 'https://corsproxy.io/?https://development-internship-api.geopostenergy.com/WorldCup/GetAllTeams';
const GIT_USER = 'AtkJr'; // Seu usuário do GitHub

// ==========================================
// 2. FUNÇÃO PRINCIPAL (O Motor do App)
// ==========================================
async function buscarSelecoes() {
    try {
        const resposta = await fetch(API_URL, {
            method: 'GET',
            headers: { 'git-user': GIT_USER }
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP! status: ${resposta.status}`);
        }

        const selecoes = await resposta.json();
        
        // Passo A: Embaralha e divide as 32 seleções em 8 grupos
        const gruposSorteados = sortearGrupos(selecoes);
        
        // Passo B: Desenha a tabela com os nomes na tela (usando a propriedade 'nome')
        desenharGruposNaTela(gruposSorteados);

        // Passo C: Simula as 3 rodadas de jogos para cada grupo
        const resultadosDaFaseDeGrupos = simularFaseDeGrupos(gruposSorteados);
        
        const oitavasDeFinal = calcularClassificacao(gruposSorteados, resultadosDaFaseDeGrupos);
        console.log("🔥 Classificados para as Oitavas:", oitavasDeFinal);

        // ADICIONE ESTAS 3 LINHAS AQUI (Passo E)
        const copa = jogarMataMata(oitavasDeFinal);
        console.log("👑 O GRANDE CAMPEÃO É:", copa.campeao.nome);
        console.log("📊 Detalhes do Mata-mata inteiro:", copa);

        // PASSO F: Desenhar a fase final na tela!
        desenharMataMataNaTela(copa);
        
        // PASSO G: Envia o resultado obrigatório da Final!
        await enviarCampeao(copa.jogoFinal);
        
        // Mostra os resultados no Console para a gente conferir se funcionou
        console.log("🏆 Resultados da Fase de Grupos:", resultadosDaFaseDeGrupos);

    } catch (erro) {
        console.error("Ops, deu um erro ao buscar as seleções:", erro);
    }
}

// ==========================================
// 3. FUNÇÕES AUXILIARES (As Engrenagens)
// ==========================================

// Função que embaralha e divide as seleções
function sortearGrupos(selecoes) {
    const selecoesEmbaralhadas = selecoes.sort(() => Math.random() - 0.5);
    const letrasGrupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const gruposProntos = {};

    for (let i = 0; i < 8; i++) {
        const letra = letrasGrupos[i];
        const timesDoGrupo = selecoesEmbaralhadas.slice(i * 4, (i + 1) * 4);
        gruposProntos[letra] = timesDoGrupo;
    }
    
    return gruposProntos;
}

// Função que injeta o HTML na página
function desenharGruposNaTela(grupos) {
    const container = document.getElementById('container-grupos');
    container.innerHTML = '';

    for (const [letra, times] of Object.entries(grupos)) {
        let htmlDoGrupo = `
            <div class="grupo-card">
                <h2>Grupo ${letra}</h2>
                <ul>
        `;
        
        times.forEach(time => {
            // Usando a chave 'nome' que descobrimos no Console
            const nomeDoTime = time.nome; 
            htmlDoGrupo += `<li>${nomeDoTime}</li>`;
        });

        htmlDoGrupo += `
                </ul>
            </div>
        `;
        
        container.innerHTML += htmlDoGrupo;
    }
}

// Nova Função: Gera uma quantidade aleatória de gols (de 0 a 5)
function gerarGols() {
    return Math.floor(Math.random() * 6);
}

// Nova Função: Gera as partidas e os placares de cada grupo
function simularFaseDeGrupos(grupos) {
    const todosOsJogos = {};

    for (const [letra, times] of Object.entries(grupos)) {
        // Confrontos padrão de um grupo de 4 times (índices 0, 1, 2, 3)
        const partidasDoGrupo = [
            { timeA: times[0], timeB: times[1], golsA: gerarGols(), golsB: gerarGols() },
            { timeA: times[2], timeB: times[3], golsA: gerarGols(), golsB: gerarGols() },
            { timeA: times[0], timeB: times[2], golsA: gerarGols(), golsB: gerarGols() },
            { timeA: times[1], timeB: times[3], golsA: gerarGols(), golsB: gerarGols() },
            { timeA: times[0], timeB: times[3], golsA: gerarGols(), golsB: gerarGols() },
            { timeA: times[1], timeB: times[2], golsA: gerarGols(), golsB: gerarGols() }
        ];

        todosOsJogos[letra] = partidasDoGrupo;
    }

    return todosOsJogos;
}

// ==========================================
// 4. INÍCIO DO PROGRAMA
// ==========================================
buscarSelecoes();
// Função para calcular os pontos e definir quem passa para as Oitavas
function calcularClassificacao(grupos, jogos) {
    const classificados = []; // Aqui vamos guardar os 16 times que passam

    // Passa por cada grupo (A, B, C...)
    for (const [letra, times] of Object.entries(grupos)) {
        
        // 1. Cria uma "tabela" zerada para cada time do grupo
        const tabela = times.map(time => ({
            time: time,
            pontos: 0,
            golsFeitos: 0,
            golsSofridos: 0,
            saldoDeGols: 0
        }));

        // 2. Analisa cada jogo do grupo para somar os pontos e gols
        const partidasDoGrupo = jogos[letra];
        partidasDoGrupo.forEach(jogo => {
            // Acha os times na nossa tabela pelo ID (token)
            const statA = tabela.find(t => t.time.token === jogo.timeA.token);
            const statB = tabela.find(t => t.time.token === jogo.timeB.token);

            // Soma os gols
            statA.golsFeitos += jogo.golsA;
            statA.golsSofridos += jogo.golsB;
            statA.saldoDeGols = statA.golsFeitos - statA.golsSofridos;

            statB.golsFeitos += jogo.golsB;
            statB.golsSofridos += jogo.golsA;
            statB.saldoDeGols = statB.golsFeitos - statB.golsSofridos;

            // Define os pontos de vitória ou empate
            if (jogo.golsA > jogo.golsB) {
                statA.pontos += 3; 
            } else if (jogo.golsB > jogo.golsA) {
                statB.pontos += 3; 
            } else {
                statA.pontos += 1; 
                statB.pontos += 1;
            }
        });

        // 3. Ordena a tabela seguindo as regras da prova
        tabela.sort((a, b) => {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos; // 1º critério: Pontos
            if (b.saldoDeGols !== a.saldoDeGols) return b.saldoDeGols - a.saldoDeGols; // 2º critério: Saldo
            return Math.random() - 0.5; // 3º critério: Sorteio
        });

        // 4. Pega os 2 melhores (índices 0 e 1) e coloca na lista de classificados
        classificados.push(tabela[0].time);
        classificados.push(tabela[1].time);
    }

    // Retorna os 16 times que vão para as Oitavas
    return classificados;
}
// ==========================================
// 5. FUNÇÕES DO MATA-MATA E PÊNALTIS
// ==========================================

// Função para simular os pênaltis caso dê empate no tempo normal
function simularPenaltis() {
    let penaltisA = 0;
    let penaltisB = 0;
    
    // Para não ter empate eterno nos pênaltis, repetimos até alguém ganhar
    while (penaltisA === penaltisB) {
        penaltisA = Math.floor(Math.random() * 5) + 1; // Pode fazer de 1 a 5 gols
        penaltisB = Math.floor(Math.random() * 5) + 1;
    }
    return { penaltisA, penaltisB };
}

// Função genérica que simula qualquer fase do mata-mata (oitavas, quartas, etc)
function simularFaseMataMata(timesDaFase) {
    const vencedores = [];
    const resultados = [];

    // Pega de 2 em 2 times para fazer o confronto
    for (let i = 0; i < timesDaFase.length; i += 2) {
        const timeA = timesDaFase[i];
        const timeB = timesDaFase[i + 1];

        let golsA = gerarGols();
        let golsB = gerarGols();
        let golsPenaltyA = 0;
        let golsPenaltyB = 0;
        let vencedor = null;

        // Define quem ganhou no tempo normal
        if (golsA > golsB) {
            vencedor = timeA;
        } else if (golsB > golsA) {
            vencedor = timeB;
        } else {
            // Se empatou, chama a função de pênaltis!
            const resultPenaltis = simularPenaltis();
            golsPenaltyA = resultPenaltis.penaltisA;
            golsPenaltyB = resultPenaltis.penaltisB;
            // O vencedor é quem fez mais gols de pênalti
            vencedor = (golsPenaltyA > golsPenaltyB) ? timeA : timeB;
        }

        // Guarda todos os dados do jogo (isso vai ser útil na hora de enviar pra API no final)
        resultados.push({ timeA, timeB, golsA, golsB, golsPenaltyA, golsPenaltyB, vencedor });
        vencedores.push(vencedor);
    }

    // Retorna quem passou de fase e os placares
    return { vencedores, resultados };
}

// Função que organiza o chaveamento da prova e roda todas as fases
function jogarMataMata(classificados) {
    // Organizando a lista para os confrontos exatos da "Figura 1"
    let timesChaveamento = [
        classificados[0], classificados[3],   // 1º do A  x  2º do B
        classificados[4], classificados[7],   // 1º do C  x  2º do D
        classificados[8], classificados[11],  // 1º do E  x  2º do F
        classificados[12], classificados[15], // 1º do G  x  2º do H
        classificados[2], classificados[1],   // 1º do B  x  2º do A
        classificados[6], classificados[5],   // 1º do D  x  2º do C
        classificados[10], classificados[9],  // 1º do F  x  2º do E
        classificados[14], classificados[13]  // 1º do H  x  2º do G
    ];

    // Simulando fase a fase jogando os vencedores da anterior
    const oitavas = simularFaseMataMata(timesChaveamento);
    const quartas = simularFaseMataMata(oitavas.vencedores);
    const semis = simularFaseMataMata(quartas.vencedores);
    const final = simularFaseMataMata(semis.vencedores);

    // O grande campeão será o único time que sobrou na lista de vencedores da Final
    const campeao = final.vencedores[0];

    return {
        oitavas: oitavas.resultados,
        quartas: quartas.resultados,
        semis: semis.resultados,
        jogoFinal: final.resultados[0], 
        campeao: campeao
    };
}
// ==========================================
// 6. RENDERIZANDO O MATA-MATA NA TELA
// ==========================================

// Função auxiliar para montar o HTML de uma lista de jogos
function gerarHtmlJogos(jogos) {
    let html = '';
    jogos.forEach(jogo => {
        // Verifica se teve pênaltis para exibir o aviso
        let avisoPenaltis = '';
        if (jogo.golsPenaltyA > 0 || jogo.golsPenaltyB > 0) {
            avisoPenaltis = `<span class="penaltis">Pênaltis: ${jogo.golsPenaltyA} x ${jogo.golsPenaltyB}</span>`;
        }

        // Verifica quem ganhou para aplicar a classe CSS "vencedor" que pinta de verde neon
        let classeVencedorA = jogo.vencedor.nome === jogo.timeA.nome ? 'vencedor' : '';
        let classeVencedorB = jogo.vencedor.nome === jogo.timeB.nome ? 'vencedor' : '';

        html += `
            <div class="partida-card">
                <div class="time ${classeVencedorA}">
                    <span>${jogo.timeA.nome}</span> 
                    <b>${jogo.golsA}</b>
                </div>
                <div class="time ${classeVencedorB}">
                    <span>${jogo.timeB.nome}</span> 
                    <b>${jogo.golsB}</b>
                </div>
                ${avisoPenaltis}
            </div>
        `;
    });
    return html;
}

// Função principal que desenha a tabela do mata-mata
function desenharMataMataNaTela(copa) {
    const container = document.getElementById('mata-mata-container');
    
    // Monta as colunas usando a função auxiliar que criamos acima
    let htmlCompleto = `
        <div class="bracket-fase">
            <h3>Oitavas</h3>
            ${gerarHtmlJogos(copa.oitavas)}
        </div>
        
        <div class="bracket-fase">
            <h3>Quartas</h3>
            ${gerarHtmlJogos(copa.quartas)}
        </div>
        
        <div class="bracket-fase">
            <h3>Semifinal</h3>
            ${gerarHtmlJogos(copa.semis)}
        </div>
        
        <div class="bracket-fase">
            <h3>Final</h3>
            ${gerarHtmlJogos([copa.jogoFinal])}
        </div>
        
        <div class="bracket-campeao">
            <h3>🏆 Campeão Mundial 🏆</h3>
            <div class="campeao-nome">${copa.campeao.nome}</div>
        </div>
    `;
    
    container.innerHTML = htmlCompleto;
}// ==========================================
// 7. CONTROLE DA MÚSICA TEMA (WAKA WAKA)
// ==========================================
const btnMusica = document.getElementById('btn-musica');
const audioTema = document.getElementById('audio-tema');
let tocando = false;

btnMusica.addEventListener('click', () => {
    if (tocando) {
        audioTema.pause();
        btnMusica.innerText = '🎺 Tocar Tema 2010';
    } else {
        audioTema.play();
        btnMusica.innerText = '🔇 Pausar Tema';
    }
    tocando = !tocando;
});
// ==========================================
// 8. ENVIANDO O CAMPEÃO PARA A API (PASSO 7)
// ==========================================
const API_POST_URL = 'https://corsproxy.io/?https://development-internship-api.geopostenergy.com/WorldCup/FinalResult';

async function enviarCampeao(jogoFinal) {
    // Montando o objeto JSON com as chaves exatas que a Katalyst pediu no PDF
    const dadosFinal = {
        "equipeA": jogoFinal.timeA.token,
        "equipeB": jogoFinal.timeB.token,
        "golsEquipeA": jogoFinal.golsA,
        "golsEquipeB": jogoFinal.golsB,
        "golsPenaltyTimeA": jogoFinal.golsPenaltyA,
        "golsPenaltyTimeB": jogoFinal.golsPenaltyB
    };

    console.log("🚀 Preparando para enviar a Final para a API:", dadosFinal);

    try {
        const resposta = await fetch(API_POST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Avisa o servidor que é um JSON
                'git-user': GIT_USER // O seu usuário do GitHub obrigatório
            },
            // Converte o nosso objeto JavaScript em um texto JSON para viajar pela internet
            body: JSON.stringify(dadosFinal) 
        });

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ao enviar! status: ${resposta.status}`);
        }

        console.log("✅ SUCESSO! Resultado da final registrado na Katalyst!");
    } catch (erro) {
        console.error("❌ Ops, falha ao enviar o campeão:", erro);
    }
}   