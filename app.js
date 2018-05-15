const UNOGS_API_URL = 'https://unogs-unogs-v1.p.mashape.com/aaapi.cgi';
const OMDB_API_URL = 'https://www.omdbapi.com' ;

const appState = {
  movies: null,
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

  let daysBack = '5';
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
    requestAllMovieReviews();
  })
    .fail((jqXHR, exception) => logError(jqXHR, exception));

  function setHeader(xhr) {
    xhr.setRequestHeader('X-Mashape-Key', 'GdPqlW6JWXmshZnos2IMD8VChbjzp1JGSXCjsnWYu1rvcs6MsH');
    xhr.setRequestHeader('Accept', 'application/json');
  }
}

function requestAllMovieReviews() {
  const promises = [];
  appState.movies.forEach(movie => promises.push(getReviewsForMovieFromAPI(movie.imdbid)));
  console.log(promises);
  Promise.all(promises).then(function(results) {
    console.log('all promises complete');
    console.log(results);
    displayResults();
  });
}

function getReviewsForMovieFromAPI(imdbid) {
  const data = {
    i: imdbid,
    apikey: 'dc59eece'
  };
  return $.ajax({
    url: OMDB_API_URL,
    data: data,
    type: 'GET',
    dataType: 'json'
  }).done(details => {
    setDetailsForMovie(details);
  }).fail((jqXHR, exception) => logError(jqXHR, exception));
}

function runtimeFormat(runtime) {
  if(runtime === 'N/A') {
    return '';
  }
  const min = Number(runtime.slice(0, runtime.indexOf(' ')));
  let hours = Math.floor(min / 60);
  let minutes = min % 60;
  return hours.toString() + 'h' + minutes.toString() + 'm';
}

function setDetailsForMovie(details) {
  console.log(details);
  if(details.imdbID) {
    const movieIndex = appState.movies.findIndex(movie => movie.imdbid === details.imdbID);
    if(movieIndex !== -1) {
      console.log(`movie index ${movieIndex} matched to imdbID ${details.imdbID}`);
      let reviewImdb = null;
      let reviewRt = null;
      let reviewMetacritic = null;
      const reviews = details.Ratings;
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
    
      let poster;
      details.Poster && details.Poster !== "N/A" ? poster = details.Poster : poster = "";
      appState.movies[movieIndex]['IMDBPoster'] = poster;

      if(appState.movies[movieIndex]['runtime'] === '') {
        appState.movies[movieIndex]['runtime'] = runtimeFormat(details.Runtime);
      }
    } else {
      console.log(`No match in state. details: ${details}`);
    }
  } else {
    console.log(`No result returned. details: ${JSON.stringify(details)}`);
  }
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
      <a href="javascript:void(0)" class="js-movie" data-imdbid="${movie.imdbid}"><img class="thumbnail" src="${changeToHttps(movie.image)}" alt="${movie.title}">
      <p class="title">${movie.title}</p></a>
      <p class="runtime">${movie.runtime ? 'Runtime: ' +  movie.runtime : ''}</p>
      <p class="rating">${movie.reviewImdb ? 'ImDB: ' +  movie.reviewImdb : ''}</p>
      <p class="rating">${movie.reviewMetacritic ? 'Metacritic: ' +  movie.reviewMetacritic : ''}</p>
      <p class="rating">${movie.reviewRt ? 'Rotten Tomatoes: ' + movie.reviewRt : ''}</p>
    </div>
  </div> 
  `;
}

function displayResults() {
  console.log('displayResults called');
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

function getRuntimeInMinutes(str) {
  let hours, minutes;
  if(str === '') {
    return Infinity;
  } else {
    if(str.indexOf('h') !== -1) {
      hours = Number(str.slice(0, str.indexOf('h')));
      if(str.indexOf('m') !== -1) {
        minutes = Number(str.slice((str.indexOf('h') + 1), str.indexOf('m')));
      }
    }
    return hours * 60 + minutes;
  }
}

function getRating(str, separator) {
  return str !== null ? Number(str.slice(0, str.indexOf(separator))) : 0;
}

function sortMovies(type) {
  if(type === 'title') {
    appState.movies = appState.movies.sort((a, b) => {
      if(a.title < b.title) return -1;
      if(a.title > b.title) return 1;
      return 0;
    });
  } else if (type === 'runtime') {
    appState.movies = appState.movies.sort((a, b) => getRuntimeInMinutes(a.runtime) - getRuntimeInMinutes(b.runtime));
  } else if (type ==='imdb') {
    appState.movies = appState.movies.sort((a, b) => getRating(b.reviewImdb, '/') - getRating(a.reviewImdb, '/'));
  }
  else if (type ==='rottentomatoes') {
    appState.movies = appState.movies.sort((a, b) => getRating(b.reviewRt, '%') - getRating(a.reviewRt, '%'));
  }
  else if (type ==='metacritic') {
    appState.movies = appState.movies.sort((a, b) => getRating(b.reviewMetacritic, '/') - getRating(a.reviewMetacritic, '/'));
  }  
  displayResults();
}

function handleSortSubmit() {
  $('.js-form').submit(event => {
    event.preventDefault();
    sortMovies($('#sort-by').val());
  });
}

function renderDetail(movie) {
  let poster;
  if(movie.largeimage !== "") {
    poster = movie.largeimage;
  } else if (movie.IMDBPoster !== "") {
    poster = movie.IMDBPoster;
  } else {
    poster = movie.image;
  }  
  return `
    <div class="row">
    <div class="col-12">
      <div id="detail-frame">
        <img src="${poster}" alt="">
        <p class="detail-title">${movie.title}</p>
        <p class="detail-released">${movie.released}</p>
        <p class="detail-synopsis">${movie.synopsis}</p>
        <button class='js-back-button'>Back</button>
      </div>
    </div>
  </div>  
  `;
}

function returnToResults () {
  $('#results').hide();
  displayResults();
  $('#results').fadeIn('slow');
}

function handleBackButtonClick() {
  $('.js-back-button').click(returnToResults);
}

function getMovieFromIMDBID(imdbid) {
  return appState.movies.find(movie => movie.imdbid === imdbid);
}

function handleMovieClick() {
  $('#results').on('click', '.js-movie', function(event) {
    const imdbid = $(this).attr('data-imdbid');
    const movie = getMovieFromIMDBID(imdbid);
    $('#results').hide();
    if(movie) {
      $('#results').html(renderDetail(movie));
    } else {
      alert('movie could not be found');
    }
    handleBackButtonClick();
    $('#results').fadeIn('slow');
  });
}

function startApp() {
  getMovieListFromAPI();
  handleSortSubmit();
  handleMovieClick();
}
$(startApp);