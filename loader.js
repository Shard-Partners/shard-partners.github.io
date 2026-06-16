(function(){
  var sections=["nav", "hero", "story", "practice", "recognition", "team", "contact", "footer"];
  Promise.all(sections.map(function(s){
    return fetch("sections/"+s+".html")
      .then(function(r){return r.text();})
      .then(function(html){
        var el=document.getElementById("slot-"+s);
        if(el)el.outerHTML=html;
      });
  })).then(function(){
    var sc=document.createElement("script");
    sc.src="app.js";
    document.body.appendChild(sc);
  });
})();
