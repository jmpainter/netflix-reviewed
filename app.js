const UNOGS_API_URL = 'https://unogs-unogs-v1.p.mashape.com/aaapi.cgi'

function getDataFromApi() {

  let daysBack = '7';
  let countryId = 'US';
  let page = '1'
  const queryString = `q=get:new${daysBack}:${countryId}&p=${page}&t=ns&st=adv`
  $.ajax({
    url: UNOGS_API_URL + '?' + queryString,
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    beforeSend: setHeader
  }).done(data => console.log(data))
    .fail(function (jqXHR, exception) {
      // Our error logic here
      var msg = '';
      if (jqXHR.status === 0) {
          msg = 'Not connect.\n Verify Network.';
      } else if (jqXHR.status == 404) {
          msg = 'Requested page not found. [404]';
      } else if (jqXHR.status == 500) {
          msg = 'Internal Server Error [500].';
      } else if (exception === 'parsererror') {
          msg = 'Requested JSON parse failed.';
      } else if (exception === 'timeout') {
          msg = 'Time out error.';
      } else if (exception === 'abort') {
          msg = 'Ajax request aborted.';
      } else {
          msg = 'Uncaught Error.\n' + jqXHR.responseText;
      }
      console.log(msg);
  })

  function setHeader(xhr) {
    xhr.setRequestHeader('X-Mashape-Key', 'GdPqlW6JWXmshZnos2IMD8VChbjzp1JGSXCjsnWYu1rvcs6MsH');
    xhr.setRequestHeader('Accept', 'application/json');
  }
}

function startApp() {
  getDataFromApi();
}
$(startApp);