import jqueryI18next from 'jquery-i18next';
import i18next from 'i18next';

jqueryI18next.init(i18next, $, {
    tName: 't', // --> appends $.t = i18next.t
    i18nName: 'i18n', // --> appends $.i18n = i18next
    handleName: 'localize', // --> appends $(selector).localize(opts);
    selectorAttr: 'data-i18n', // selector for translating elements
    targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if different than itself)
    optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
    useOptionsAttr: false, // see optionsAttr
    parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
});


i18next.init({
    lng: 'de',
    resources: {
        en: {
            translation: {
                nav: {
                    link: 'Upload project'
                }
            }
        },
        de: {
            translation: {
                nav: {
                    page1: 'Projekt hochladen'
                }
            }
        }
    }
}, function (err, t) {
    jqueryI18next.init(i18next, $);
    $('.nav-link').localize();

    $('.lang-select').click(function () {
        i18next.changeLanguage(this.innerHTML).then();
        $('.nav').localize();
    });
}).then();




