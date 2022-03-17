
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timerProgressBar: true,
})
function setCookie(cname, cvalue, second=null) {
    if(second!=null){
        const d = new Date();
        d.setTime(d.getTime() + (second*1000));
        let expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }else{
        document.cookie = cname + "=" + cvalue;
    }   

}
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
$(window).on('load',function(){
    $("#btn-logout").click(function(){
        setCookie("rememberToken","",-(3*60*61));
        setCookie('accessToken',"",-41);
        setCookie('refreshToken',"",-100);
        location.href = "/";
    })
    let token = getCookie("refreshToken");
    function checkLogin(){
        $.post("/refreshToken",{token},function(data){
            if(data!=null && data!=""){
                if(data.status==1){
                    setCookie("accessToken",data.accessToken,40)
                }else{
                    location.href = "/";
                }
            }
        })
        setTimeout(() => {
            checkLogin();
        }, 25000);
    }
    checkLogin();
})