/*
  Recebe um dicionário da página como nome e links para exibir links a serem
  anotados no DBpedia Spotlight

  Autor: Lúcio Leal Bastos

*/

var allLinks = [];
var visibleLinks = [];

// Mostra todos os links
function showLinks() {
  "use strict";
  var linksTable = document.getElementById('links');
  //remove um item da lista de links. Ele será modificado e reinserido ao final do laço
  while (linksTable.children.length > 1) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1]);
  }

  for (var i = 0; i < visibleLinks.length; i++) {
    // cria elementos para serem inseridos no popup
    var div = document.createElement('div');
    var divres = document.createElement('div');
    var row = document.createElement('tr');
    var col0 = document.createElement('td');
    var col1 = document.createElement('td');
    var checkbox = document.createElement('input');
    var a = document.createElement('a');
    var buttonSearch = document.createElement('button');
    // propriedades div
    div.id = 'file' + i;
    div.class = 'file_container';
    // propriedades divres
    divres.id = 'result' + i;
    divres.class = 'results_container';
    // propriedades checkbox (ainda não usado)
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;
    // propriedades a
    a.href = visibleLinks[i].href;
    a.target = "_blank";
    a.innerText = visibleLinks[i].innertext;
    // propriedades buttonSearch
    buttonSearch.name = "enviar";
    buttonSearch.innerText = "Anotar";
    // propriedades row
    row.innerHTML = "<button name=\"enviar\" id=\"annotate" + i + "\"> Anotar</button>"
    // propriedades col1
    col1.style.whiteSpace = 'nowrap';
    // appends
    col0.appendChild(checkbox);
    col1.appendChild(a);
    row.appendChild(col1);
    div.appendChild(row);
    div.appendChild(divres);
    linksTable.appendChild(div);
    // adiciona comportamento aos botões de Anotar
    addOnClickLinks(visibleLinks[i].href, i);
  }
}

// Adiciona o comando onclick nos links anotados
function addOnClickLinks(href, i){
  //console.log("fui chamado com " + href + " e " + i);
  //insere comando javascript no botão capturando o id
  document.getElementById("annotate" + i).addEventListener("click", function(){
    //console.log("anotando link " + i);
    anota(href, i);
  });
}

// Marca o botão check de todos os links visíveis (removido)
function toggleAll() {
  var checked = document.getElementById('toggle_all').checked;
  for (var i = 0; i < visibleLinks.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

// Baixa todos os links marcados (removido)
function downloadCheckedLinks() {
  for (var i = 0; i < visibleLinks.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      chrome.downloads.download({url: visibleLinks[i]},
                                function(id) {
      });
    }
  }
  window.close();
}

// Refiltra todos os links baseado no parâmetro da barra de busca (removido)
function filterLinks() {
  var filterValue = document.getElementById('filter').value;
  if (document.getElementById('regex').checked) {
    visibleLinks = allLinks.filter(function(link) {
      return link.match(filterValue);
    });
  } else {
    var terms = filterValue.split(' ');
    visibleLinks = allLinks.filter(function(link) {
      for (var termI = 0; termI < terms.length; ++termI) {
        var term = terms[termI];
        if (term.length != 0) {
          var expected = (term[0] != '-');
          if (!expected) {
            term = term.substr(1);
            if (term.length == 0) {
              continue;
            }
          }
          var found = (-1 !== link.indexOf(term));
          if (found != expected) {
            return false;
          }
        }
      }
      return true;
    });
  }
  showLinks();
}

// Adiciona links para allLinks e visibleLinks, organiza e exibe-os. send_link.js
// é injetado em todos os frames da aba ativa, então esse listener pode ser
// chamado várias vezes
chrome.extension.onRequest.addListener(function(links) {
  for (var index in links) {
    allLinks.push(links[index]);
  }
  allLinks.sort();
  visibleLinks = allLinks;
  showLinks();addOnClickLinks();
});

// Insere manipuladores de evento e injeta send_link.js em todos os frames da
// aba ativa
window.onload = function() {
  document.getElementById('filter').onkeyup = filterLinks;
  document.getElementById('regex').onchange = filterLinks;
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('download0').onclick = downloadCheckedLinks;
  document.getElementById('download1').onclick = downloadCheckedLinks;

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id},
                      function(activeTabs) {
      chrome.tabs.executeScript(
        activeTabs[0].id, {file: 'send_links.js', allFrames: true});
    });
  });
};

// Extrai o texto do pdf usando promessas
function gettext(pdfUrl){
  var pdf = PDFJS.getDocument(pdfUrl);
  // desabilita o worker do pdf.js. Faz um trade-off entre portabilidade e
  // qualidade do pdf extraído
  PDFJS.disableWorker = true;
  // pega o texto de todas as páginas
  return pdf.then(function(pdf) {
    var maxPages = pdf.pdfInfo.numPages;
    // coleta as promessas de todas as páginas
    var countPromises = [];
    for (var j = 1; j <= maxPages; j++) {
      var page = pdf.getPage(j);
      var txt = "";
      // adiciona promessa da página
      countPromises.push(page.then(function(page) {
        var textContent = page.getTextContent();
         // retorna o conteúdo da promessa
        return textContent.then(function(text){
          // valor do texto da página
          return text.items.map(function (s) {
            return s.str;
          }).join('');
        });
      }));
     }
     // Espera por todas as promessas e dá um join no texto
     return Promise.all(countPromises).then(function (texts) {
       return texts.join('');
     });
  });
}

function anota (href, i) {
  // chama a função para extrair o texto do pdf
  gettext(href).then(function(text) {
    //cria elementos para serem inseridos no popup
    var appendTexto = document.getElementById('result' + i);
    var div = document.createElement('div');
    var p = document.createElement('p');
    // insere o texto na tag p. Ele será exibido abaixo do botão que chamou
    // de Anotar
    p.innerText = text;
    // appends
    appendTexto.appendChild(div);
    div.appendChild(p);
  },
  // imprime no log caso dê algum erro no processo
  function(reason) {
    console.error(reason);
  });
}
