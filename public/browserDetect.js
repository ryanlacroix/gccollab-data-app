// Internet Explorer 6-11
var isIE = /*@cc_on!@*/false || !!document.documentMode;
var div = document.getElementById("unsupported-browser");
if(isIE == true){
    div.style.display="block";
} else{
    document.getElementById("unsupported-browser").style.display="none";
}


function ignore(){
    document.getElementById("unsupported-browser").style.display="none";
}