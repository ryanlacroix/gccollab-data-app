function cleanString(r) {
  r = r.replace(/<(?:.|\n)*?>/gm, '');
  //-- get rid of html-encoded characters:
  r=r.replace(/&nbsp;/gi," ");
  r=r.replace(/&amp;/gi,"&");
  r=r.replace(/&quot;/gi,'"');
  r=r.replace(/&lt;/gi,'<');
  r=r.replace(/&gt;/gi,'>');
  r=r.replace(/&#039;/gi,"'");
  r=r.replace(/&eacute;/gi,"é");r=r.replace(/&Eacute;/gi,"É");
  r=r.replace(/&agrave;/gi,"à");r=r.replace(/&Agrave;/gi,"À");
  r=r.replace(/&egrave;/gi,"è");r=r.replace(/&Egrave;/gi,"È");
  r=r.replace(/&ucirc;/gi,"û");r=r.replace(/&ucirc;/gi,"Û");
  r=r.replace(/&ocirc;/gi,"ô");r=r.replace(/&ocirc;/gi,"Ô");
  r=r.replace(/&Icirc;/gi,"Î");r=r.replace(/&icirc;/gi,"î");
  r=r.replace(/&ccedil;/gi,"ç");r=r.replace(/&Ccedil;/gi,"Ç");
  r=r.replace(/&Acirc;/gi,"Â");r=r.replace(/&acirc;/gi,"â");
  r=r.replace(/&lsquo;/gi,"‘");r=r.replace(/&rsquo;/gi,"’");
  r=r.replace(/\n/gi," ");
  r=r.replace(/\r\n/gi," ");
  r=r.replace(/\r/gi," ");
  r=r.replace(/\t/gi," ");

  return(r);
}

module.exports = cleanString;