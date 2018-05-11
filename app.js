const UNOGS_API_URL = 'https://unogs-unogs-v1.p.mashape.com/aaapi.cgi';
const OMDB_API_URL = 'http://www.omdbapi.com' ;

const appState = {
  movies: null,
  movieCounter: 0
};

function getMovieListFromAPI() {

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
  }).done(data => addReviewsToData(data))
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

function getReviewsFromAPI(imdbid) {
  const data = {
    i: imdbid,
    apikey: 'dc59eece'
  };
  $.ajax({
    url: OMDB_API_URL,
    data: data,
    type: 'GET',
    dataType: 'json',
  }).done(detail => {
    setReviewsForMovie(imdbid, detail.Ratings);
  }).fail((jqXHR, exception) => {reviews = null});
}

function setReviewsForMovie(imdbid, reviews) {
  let movieIndex = appState.movies.findIndex(movie => movie.imdbid === imdbid);
  let reviewImdb = null;
  let reviewRt = null;
  let reviewMetacritic = null;
  if(reviews) {
    reviews.forEach(review => {
      if(review.Source === 'Internet Movie Database') {
        reviewImdb = review.Value;
      } else if (review.Source === 'Rotten Tomatoes') {
        reviewRt = review.Value;
      } else if (review.Source === 'Metacritic') {
        reviewMetacritic = review.Value;
      }
    });
  }
  appState.movies[movieIndex]['reviewImdb'] = reviewImdb;
  appState.movies[movieIndex]['reviewRt'] = reviewRt;
  appState.movies[movieIndex]['reviewMetacritic'] = reviewMetacritic;
  appState.movieCounter++;
  if(appState.movieCounter === appState.movies.length) {
    displayResults();
  }
}

function renderMovie(movie) {
  return `
  <div class="col-2">
    <div class="movie-frame">
      <img class="thumbnail" src="${movie.image}" alt="${movie.title}">
      <p class="title">${movie.title}</p>
      <p class="runtime">Runtime: ${movie.runtime}</p>
      <p class="rating">${movie.reviewImdb ? 'ImDB: ' +  movie.reviewImdb : ''}</p>
      <p class="rating">${movie.reviewMetacritic ? 'Metacritic: ' +  movie.reviewMetacritic : ''}</p>
      <p class="rating">${movie.reviewRt ? 'Rotten Tomatoes: ' + movie.reviewRt : ''}</p>
    </div>
  </div> 
  `;
}

function displayResults() {
  console.log(appState.movies);
  let results = '';
  if(appState.movies.length > 0) {
    results = results + '<div class="row">\n';
    for(let i = 0; i < appState.movies.length; i++){
      results = results += renderMovie(appState.movies[i]);
      if((i + 1) % 6 === 0) {
        results = results + '</div><div class="row">';
      }
    }
    results = results + '</div>\n';
  }
  $('#results').html(results);
}

// {Source: "Internet Movie Database", Value: "6.5/10"}
// {Source: "Rotten Tomatoes", Value: "33%"}
// {Source: "Metacritic", Value: "37/100"}

function addReviewsToData(data) {
  appState.movies = data.ITEMS;
  appState.movies.forEach(movie => {
    getReviewsFromAPI(movie.imdbid);
  });
}

function startApp() {
  getMovieListFromAPI();
}
$(startApp);