var message = document.getElementById("linkCheck").innerHTML;
document.getElementById("linkCheck").innerHTML = replaceURLs(message)

function replaceURLs(message) {
    if (!message) return;
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return message.replace(urlRegex,function(url) {
        var hyperlink = url;
        if(!hyperlink.match('^https?:\/\/')) {
            hyperlink ='https://' + hyperlink;
        }
        return '<a style="color: orange; text-decoration: none" href="' + hyperlink + '" target="_blank" rel="noopener noreferrer">' + url + '</a>'
    });
}

function googleTranslateElementInit() {
    new google.translate.TranslateElement( { pageLanguage: 'en' },
    'google_translate_element'
    );
};