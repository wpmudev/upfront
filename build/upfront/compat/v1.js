(function(e,t){function i(){var t=((Upfront.data||{}).Compat||{}).notice,n=((Upfront.data||{}).Compat||{}).snapshot_url,i=n.match(/premium\.wpmudev\.org/)?"Install Snapshot":"Backup with Snapshot";return r=function(){return e.post(Upfront.Settings.ajax_url,{action:"upfront-notices-dismiss"})},'<div class="upfront-version_compatibility-nag"><p>'+t+"</p>"+"<div>"+'<a class="boot" href="#boot">Proceed to edit</a>'+(n?'<a class="update" href="'+n+'">'+i+"</a>":"")+"</div>"+"</div>"+""}function s(){var e=((Upfront.data||{}).Compat||{}).theme||"your current theme",t=((Upfront.data||{}).Compat||{}).theme_url;return'<div class="upfront-version_compatibility-nag"><p>A new version of <b>'+e+"</b> is available. We recommend you Update <b>"+e+"</b> before making any edits.</p>"+"<div>"+'<a class="boot" href="#boot">Proceed to edit</a>'+(t?'<a class="update" href="'+t+'">Update '+e+"</a>":"")+"</div>"+"</div>"+""}function o(){var e=((Upfront.data||{}).Compat||{}).snapshot_url||!1;return e?i():s()}function u(){return _nag=e.magnificPopup.open({items:{src:o(),type:"inline"},mainClass:"uf-upgrade-notice"}),e(".upfront-version_compatibility-nag").find('a[href="#boot"]').off("click").on("click",function(t){return t.preventDefault&&t.preventDefault(),t.stopPropagation&&t.stopPropagation(),e.magnificPopup.close(),Upfront.Application.start=n,n.apply(Upfront.Application),r&&"function"==typeof r&&r.apply(this),!1}).end(),!1}var n,r=function(){};(function a(){if(!((window.Upfront||{}).Events||{}).on)return setTimeout(a);Upfront.Events.on("application:loaded:layout_editor",function(){n=Upfront.Application.start,Upfront.Application.start=u})})()})(jQuery);