(function(e){define([],function(){e("body").append('<div id="element-settings-sidebar" />'),e("#element-settings-sidebar").width(0);var t,n=function(){t&&(t.cleanUp(),t=!1,e("#element-settings-sidebar").width(0).html(""),Upfront.Events.off("element:settings:saved",n))},r=function(r){var i,s;if(t){Upfront.Events.trigger("element:settings:canceled");return}i=_(Upfront.Application.LayoutEditor.Objects).reduce(function(e,t){return r instanceof t.View?t:e},!1),i=i&&i.Settings?i:Upfront.Views.Editor.Settings,s=i.Settings,t=new s({model:r.model,anchor:i?i.anchor:!1}),t.for_view=r,t.render(),e("#element-settings-sidebar").html(t.el),e("#element-settings-sidebar").width(260),e(".uf-settings-panel--expanded:not(:first)").toggleClass("uf-settings-panel--expanded").find(".uf-settings-panel__body").toggle(),Upfront.Events.on("element:settings:saved",n)};Upfront.Events.on("element:settings:activate",r),Upfront.Events.on("entity:removed:after",n),Upfront.Events.on("element:settings:canceled",n)})})(jQuery);