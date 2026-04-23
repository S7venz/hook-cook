(function () {
  if (location.pathname === '/' || location.pathname === '/index.html') {
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = 'http://localhost:8080/api/uploads/hero-home.webp';
    link.fetchPriority = 'high';
    link.type = 'image/webp';
    document.head.appendChild(link);
  }
})();
