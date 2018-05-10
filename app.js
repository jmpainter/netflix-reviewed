const UNOGS_API_URL = 'https://unogs-unogs-v1.p.mashape.com/aaapi.cgi';
const OMDB_API_URL = 'http://www.omdbapi.com' ;

const appState = {
  movies: null,
  movieCounter: 0
};

function getMovieList() {

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

function getReviews(imdbid) {
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
  appState.movies[movieIndex]['review-imdb'] = reviewImdb;
  appState.movies[movieIndex]['review-rt'] = reviewRt;
  appState.movies[movieIndex]['review-metacritic'] = reviewMetacritic;
  appState.movieCounter++;
  if(appState.movieCounter === appState.movies.length) {
    console.log('FINISHED!');
    console.log(appState.movies);
  }
}

// :
// {Source: "Internet Movie Database", Value: "6.5/10"}
// 1
// :
// {Source: "Rotten Tomatoes", Value: "33%"}
// 2
// :
// {Source: "Metacritic", Value: "37/100"}

function addReviewsToData(data) {
  // console.log(data);
  appState.movies = data.ITEMS;
  // console.log(appState.movies);
  // let reviews = null;
  // let length = data.ITEMS.length;
  // // console.log(appState.movies.length);
  // for(let i = 0; i < length; i++) {
  //   reviews = getReviews(data.ITEMS[i].imdbid);
  //   // console.log(reviews);
  // };
  let reviews = null;
  // console.log(appState.movies);
  appState.movies.forEach(movie => {
    reviews = getReviews(movie.imdbid);
  });
  
}

function startApp() {
  getMovieList();
}
$(startApp);