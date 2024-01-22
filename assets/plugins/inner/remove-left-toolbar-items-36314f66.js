import{d as r}from"../../index-eb125c8a.js";import"../../messenger-provider-f9c945a3.js";const i=`
.tabbed-pane-header {
  flex: 0 0 33px;
}
.tabbed-pane-header > .tabbed-pane-left-toolbar.toolbar {
  display: none !important;
}
.tabbed-pane-header .tabbed-pane-header-tab {
  height: 32px;
}
.tabbed-pane-right-toolbar {
  display: flex;
  align-items: center;
}
`.trim(),d=r({devtools:{beforeMount({devtoolsWindow:a}){const o=a.document.createElement("style");o.innerHTML=i;let e;return async function(){var t;for(;;){if(e=a.document.querySelector(".main-tabbed-pane"),!e){await new Promise(n=>setTimeout(n,100));continue}(t=e.shadowRoot)==null||t.appendChild(o);break}}(),()=>{var t;(t=e==null?void 0:e.shadowRoot)==null||t.removeChild(o)}},load({inspectorView:{tabbedPane:a}}){a.leftToolbar().removeToolbarItems()}}});export{d as _};
