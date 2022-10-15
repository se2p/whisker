const header = `<div id="scroll-background">            
                    <div class="navbar-collapse">
                        <ul id="mainMenu" class="nav ml-auto" style="max-width:650px;">
                            <li class="nav-item"><a class="nav-link" href="" data-i18n="header:testing" id="link"></a></li>
                            <li class="nav-item"><a class="nav-link" href="" data-i18n="header:tutorial" id="tutorial"></a></li>
                            <li class="nav-item"><a class="nav-link" href="" data-i18n="header:about" id="about"></a></li>
                            <li class="nav-item"><form id="form-lang"></form></li>
                        </ul>
                    </div>
                </div>`;


window.addEventListener('DOMContentLoaded', () => {
    let headerContent = document.querySelector('div[role="navigation"]');
    headerContent.innerHTML = header;
});
