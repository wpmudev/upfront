jQuery(document).ready(function(e){function t(e){var t=document.createElement("div"),n=new RegExp("(khtml|moz|ms|webkit|)"+e,"i");for(s in t.style)if(s.match(n))return!0;return!1}function n(){e(".upfront-output-region-container").each(function(){var t=e(this).find(".upfront-output-region").not(".upfront-region-fixed, .upfront-region-lightbox"),n=e(this).hasClass("upfront-region-container-full"),r=height=0,i=[];n?(height=e(window).height(),t.each(function(){e(this).closest(".upfront-output-region-sub-container").length&&(height-=e(this).outerHeight(),i.push(this))}),t.each(function(){var t=!1,n=this;e.each(i,function(e,r){r==n&&(t=!0)}),t||e(this).css({minHeight:height,height:height,maxHeight:height})})):t.length>1&&(t.each(function(){var t=parseInt(e(this).css("min-height")),n=e(this).outerHeight();t&&(r=t>r?t:r),height=n>height?n:height}),t.css({minHeight:height,height:"",maxHeight:""}))})}function r(){e("[data-bg-image-ratio]").each(function(){var t=e(this).outerWidth(),n=e(this).outerHeight(),r=parseFloat(e(this).attr("data-bg-image-ratio"));Math.round(n/t*100)/100>r?e(this).css("background-size",n/r+"px "+n+"px"):e(this).css("background-size",t+"px "+t*r+"px")}),e("[data-bg-video-ratio]").each(function(){var t=e(this).outerWidth(),n=e(this).outerHeight(),r=parseFloat(e(this).attr("data-bg-video-ratio")),i=e(this).attr("data-bg-video-style")||"crop",s=e(this).children("iframe");e(this).css("overflow","hidden"),s.css({position:"absolute"});if(i=="crop")if(Math.round(n/t*100)/100>r){var o=n/r;s.css({width:o,height:n,top:0,left:(t-o)/2})}else{var u=t*r;s.css({width:t,height:u,top:(n-u)/2,left:0})}else if(i=="full")s.css({top:0,left:0,width:t,height:n});else if(i=="inside")if(Math.round(n/t*100)/100<r){var o=n/r;s.css({width:o,height:n,top:0,left:(t-o)/2})}else{var u=t*r;s.css({width:t,height:u,top:(n-u)/2,left:0})}})}t("flex")?e("html").addClass("flexbox-support"):(n(),e(window).on("load",n),e(window).on("resize",n)),r(),e(window).on("resize",r);var i=e('<div class="upfront-lightbox-bg"></div>'),o=e('<div class="upfront-ui close_lightbox"></div>'),u=e('<div class="upfront-icon upfront-icon-popup-close"></div>');e(document).on("click","a",function(t){if(e("div#sidebar-ui").length>0&&e("div#sidebar-ui").css("display")=="block")return;var n=e(this).attr("href");if(n.indexOf("#")>=0){var r=n.split("#");if(r[1].trim()!=""&&r[1].trim().indexOf("ltb-")==0){var s=e("div.upfront-region-"+r[1].trim());i.css("background-color",s.data("overlay")).insertBefore(s);if(s.data("closeicon")=="yes"||s.data("addclosetext")=="yes")s.prepend(o),s.data("addclosetext")=="yes"&&(o.append(e("<h3>"+s.data("closetext")+"</h3>")),s.data("closeicon")=="yes"&&o.children("h3").css("margin-right","40px")),s.data("closeicon")=="yes"&&o.append(u),o.bind("click",function(){a()});s.data("clickout")=="yes"&&i.bind("click",function(){a()}),s.css("width",e("div.upfront-grid-layout").first().width()*s.data("col")/24),s.show().css({"margin-left":-parseInt(s.width()/2),"margin-top":-parseInt(s.height()/2)}),e(document).trigger("upfront-lightbox-open"),t.preventDefault();function a(){o.html("").remove(),i.remove(),s.hide()}}}})});