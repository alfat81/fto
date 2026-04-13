const ToastModule = (function() {
    let box;
    function init() {
        if (!document.getElementById('toast-box')) {
            box = document.createElement('div');
            box.id = 'toast-box';
            Object.assign(box.style, { position:'fixed', top:'20px', right:'20px', zIndex:'9999', display:'flex', flexDirection:'column', gap:'10px' });
            document.body.appendChild(box);
        } else box = document.getElementById('toast-box');
    }
    function show(msg, type='info') {
        if(!box) init();
        const t = document.createElement('div');
        const colors = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
        Object.assign(t.style, { background:'#fff', padding:'12px 20px', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.15)', borderLeft:`4px solid ${colors[type]}`, fontSize:'14px', animation:'slideIn 0.3s' });
        t.textContent = msg;
        box.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3000);
    }
    return { init, show, success:(m)=>show(m,'success'), error:(m)=>show(m,'error') };
})();