
// Set the focus outline color here:
const outlineColor = '#eb4034';
// ---------------------------------

export function removeFocusOutlineUnlessKeypress(): void {
    const styleElement = document.createElement('style'),
        head = document.getElementsByTagName('head')[0],
        setCss = (cssText: string) => {
            (styleElement as any).styleSheet ?
                (styleElement as any).styleSheet.cssText = cssText :
                styleElement.innerHTML = cssText;
        };

    head.appendChild(styleElement);

    document.addEventListener('mousedown', function(){
        setCss(':focus{outline:0}');
    });

    document.addEventListener('keydown', function(e) {
        const whitelistNames = ['Enter', ' ', 'Tab'];

        if (whitelistNames.includes(e.key)) {
            setCss(`
                :focus{outline: solid 3px ${outlineColor};}            
            `);
        }
    });
}
