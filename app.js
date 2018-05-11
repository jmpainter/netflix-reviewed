const UNOGS_API_URL = 'https://unogs-unogs-v1.p.mashape.com/aaapi.cgi';
const OMDB_API_URL = 'https://www.omdbapi.com' ;

const appState = {
  movies: null,
  currentMovie: 0
};

function logError(jqXHR, exception) {
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
}

function getMovieListFromAPI() {

  let daysBack = '14';
  let countryId = 'US';
  let page = '1'
  const queryString = `q=get:new${daysBack}:${countryId}&p=${page}&t=ns&st=adv`
  $.ajax({
    url: UNOGS_API_URL + '?' + queryString,
    type: 'GET',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    beforeSend: setHeader
  }).done(data => {
    appState.movies = data.ITEMS;
    console.log(appState.movies);
    getReviewsForMovieFromAPI();
  })
    .fail((jqXHR, exception) => logError(jqXHR, exception));

  function setHeader(xhr) {
    xhr.setRequestHeader('X-Mashape-Key', 'GdPqlW6JWXmshZnos2IMD8VChbjzp1JGSXCjsnWYu1rvcs6MsH');
    xhr.setRequestHeader('Accept', 'application/json');
  }
}

function getReviewsForMovieFromAPI() {
  console.log('getReviewsForMovieFromAPI called: ' + appState.currentMovie);
  const data = {
    i: appState.movies[appState.currentMovie].imdbid,
    apikey: 'dc59eece'
  };
  $.ajax({
    url: OMDB_API_URL,
    data: data,
    type: 'GET',
    dataType: 'json'
  }).done(detail => {
    console.log(detail);
    setReviewsForMovie(detail.Ratings);
    appState.currentMovie++;      
    if(appState.currentMovie < appState.movies.length) {
      console.log('appState.currentMovie,  appState.movies.length: ' + appState.currentMovie + ', ' + appState.movies.length);
      getReviewsForMovieFromAPI();
    } else {
      displayResults();
    }
  }).fail((jqXHR, exception) => logError(jqXHR, exception));
}

function setReviewsForMovie(reviews) {
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
  appState.movies[appState.currentMovie]['reviewImdb'] = reviewImdb;
  appState.movies[appState.currentMovie]['reviewRt'] = reviewRt;
  appState.movies[appState.currentMovie]['reviewMetacritic'] = reviewMetacritic;
}

function changeToHttps(url) {
  if(url.indexOf('http://') !== -1) {
    url = 'https' + url.slice(4);
  }
  return url;
}

function renderMovie(movie) {
  return `
  <div class="col-2">
    <div class="movie-frame">
      <img class="thumbnail" src="${changeToHttps(movie.image)}" alt="${movie.title}">
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

function startApp() {
  getMovieListFromAPI();
}
$(startApp);