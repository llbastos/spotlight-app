// Lista de todos os links da página
var links1 = [].slice.apply(document.getElementsByTagName('a'));

// Cria uma nova lista com todos os links de interesse (com recursos do Moodle)
var links = [];
for (var link in links1) {
  if(links1[link].toString().includes("resource/view.php?id")) {
    links.push(links1[link]);
  }
}

// Cria uma lista de nomes dos links
var nomes = [];
for (var index in links) {
  var span = links[index].getElementsByClassName('instancename')[0].innerText;
  span = span.replace(" Arquivo", "");
  nomes.push(span);
}

links = links.map(function(element) {
  // Retorna um dicionário com informações da url, nome do texto para ser
  // exibido no link e uma variável vazia do conteúdo
  var href1 = element.href;
  var innertext1 = element.innerText;
  // remove a parte do texto interno da tag a que não é necessária
  innertext1 = innertext1.replace(" Arquivo", "");
  var hashIndex = href1.indexOf('#');
  if (hashIndex >= 0) {
    href1 = href1.substr(0, hashIndex);
  }
  // dicionário de retorno
  return {
    href: href1,
    innertext: innertext1,
    content: ""
  };
});

// organiza os links em ordem lexicográfica
links.sort();

// Envia um request para o popup.js, com uma lista de dicionários dos links
// da página
chrome.extension.sendRequest(links);
