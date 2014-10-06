(function () {
    "use strict";

    var request = new XMLHttpRequest(),
        tree;

    request.open('GET', 'json/tol.json', true);

    request.addEventListener('progress', function (e) {
        console.log(e.loaded / e.total);
    }, true);

    request.addEventListener('load', function () {
        tree = JSON.parse(request.responseText);
        console.log('Loaded.', tree);
    }, true);

    request.addEventListener('error', function (e) {
        console.log('Something went horriby awry');
    }, true);

    request.send(null);
}());
