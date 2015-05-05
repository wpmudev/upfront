(function(e){define(["upfront/post-editor/upfront-post-edit"],function(t){var n=function(){this.parts={title:{replacements:["%title%","%permalink%"],editable:["%title%"]},contents:{replacements:["%contents%","%excerpt%"],editable:["%contents%","%excerpt%"]},excerpt:{replacements:["%excerpt%"],editable:["%excerpt%"]},author:{replacements:["%author%","%author_url%","%author_meta%"],editable:["%author%"],withParameters:["%author_meta_","%avatar_"]},categories:{replacements:["%categories%"],editable:[]},tags:{replacements:["%tags%"],editable:[]},comments_count:{replacements:["%comments_count%"],editable:[]},featured_image:{replacements:["%image%","%permalink%"],editable:["%image%"]},date:{replacements:["%date%","%date_iso%"],editable:["%date%"]},update:{replacements:["%update%","%date_iso%"],editable:["%update%"]},author_gravatar:{replacements:["%avatar_%"],editable:["%avatar%"],withParameters:["%avatar_"]}},this.markup=function(e,t,n,r){var i=this,s=r&&r.extraClasses?r.extraClasses:"",o=r&&r.attributes?r.attributes:{},u="";_.each(o,function(e,t){u+=t+'="'+e+'" '}),this.parts[e]&&this.parts[e].replacements&&_.each(this.parts[e].replacements,function(r){var o=t[r];i.parts[e].editable.indexOf(r)!==-1&&(o='<div class="upfront-content-marker upfront-content-marker-'+e+" "+s+'" '+u+">"+o+"</div>"),n=n.replace(r,o)});if(this.parts[e]&&this.parts[e].withParameters){var a=this.parts[e].withParameters;a&&_.each(a,function(e){var r=new RegExp(e+"[^%]+%","gm"),i=r.exec(n);_.each(i,function(e){n=typeof t[e]=="undefined"?"":n.replace(e,t[e])})})}return n}},r=new n,i=Backbone.View.extend({events:{"click a":"preventLinkNavigation","click .upfront-content-marker-author":"editAuthor","click .upfront-content-marker-date":"editDate","click .upost_thumbnail_changer":"editThumb","click .ueditor-action-pickercancel":"editDateCancel","click .ueditor-action-pickerok":"editDateOk"},initialize:function(t){this.post=t.post,this.postView=t.postView,this.triggeredBy=t.triggeredBy||this.$(".upfront-content-marker").first(),this.parts={},this.partOptions=t.partOptions,this.postAuthor=this.post.get("post_author"),this.authorTpl=t.authorTpl,this.contentMode=t.content_mode,this.inserts=this.post.meta.getValue("_inserts_data")||{},this.$el.addClass("clearfix").css("padding-bottom","60px"),this.rawContent=t.rawContent,this.rawExcerpt=t.rawExcerpt,this.$("a").data("bypass",!0);var n=this.$el.closest(".ui-draggable");n.length&&(cancel=n.draggable("disable")),this.$el.closest(".upfront-module-view").append("<div class='editing-overlay'></div>"),this.$el.closest(".upfront-module").addClass("editing-content"),e(".upfront-module").not(".editing-content").addClass("fadedOut").fadeTo("slow",.3),e(".change_feature_image").addClass("ueditor-display-block"),this.prepareEditableRegions(),this.prepareBox()},title_blurred:function(){this.post.is_new&&!this.box.urlEditor.hasDefinedSlug&&!_.isEmpty(this.parts.titles.html())&&(this.post.set("post_name",this.parts.titles.html().toLowerCase().replace(/\ /g,"-")),this.box.urlEditor.render())},prepareEditableRegions:function(){var t=this;this.parts.titles=this.$(".upfront-content-marker-title");if(this.parts.titles.length){var n=this.parts.titles.parent();n.is("a")&&n.replaceWith(this.parts.titles),this.onTitleEdited=_.bind(this.titleEdited,this),this.parts.titles.attr("contenteditable",!0).off("blur").on("blur",_.bind(t.title_blurred,t))}this.parts.contents=this.$(".upfront-content-marker-contents");if(this.parts.contents.length){var r=this.contentMode=="post_excerpt",i=r?this.rawExcerpt:this.rawContent,o=r?this.getExcerptEditorOptions():this.getContentEditorOptions();this.onContentsEdited=_.bind(this.contentEdited,this),this.editors=[],this.parts.contents.html(i).ueditor(o),this.parts.contents.on("keyup",this.onContentsEdited),this.parts.contents.each(function(){t.editors.push(e(this).data("ueditor"))}),this.currentContent=this.parts.contents[0]}this.parts.authors=this.$(".upfront-content-marker-author");if(this.parts.authors.length){var t=this,u=Upfront.data.ueditor.authors,a=[];_.each(u,function(e){a.push({value:e.ID,name:e.display_name})}),this.authorSelect=new s({options:a}),this.authorSelect.on("select",function(e){t.changeAuthor(e)}),this.$el.append(this.authorSelect.$el)}this.parts.author_gravatars=this.$(".upfront-content-marker-author-gravatar");if(this.parts.authors.length){var t=this,u=Upfront.data.ueditor.authors,a=[];_.each(u,function(e){a.push({value:e.ID,name:e.display_name})}),this.authorSelect=new s({options:a}),this.authorSelect.on("select",function(e){t.changeAuthor(e)}),this.$el.append(this.authorSelect.$el)}this.parts.dates=this.$(".upfront-content-marker-date");if(this.parts.dates.length){var t=this,f={},a=[],l=this.post.get("post_date"),c=this.getDateFormat();f.minutes=_.range(0,60),f.hours=_.range(0,24),f.currentHour=l.getHours(),f.currentMinute=l.getHours(),this.datepickerTpl=_.template(e(Upfront.data.tpls.popup).find("#datepicker-tpl").html()),this.$el.prepend(this.datepickerTpl(f)),this.datepicker=this.$(".upfront-bar-datepicker"),this.datepicker.datepicker({changeMonth:!0,changeYear:!0,dateFormat:c,onChangeMonthYear:function(n,r,i){var s=i.selectedDay,o=new Date(t.parts.dates.text()),u=new Date(n,r-1,s,o.getHours(),o.getMinutes());t.parts.dates.html(e.datepicker.formatDate(c,u)),t.post.set("post_date",u),t.datepicker.datepicker("setDate",u)},onSelect:function(e){t.parts.dates.html(e)}})}this.parts.featured=this.$(".upfront-content-marker-featured_image");if(this.parts.featured.length){var h=this.post.meta.getValue("_thumbnail_id"),p=this.partOptions.featured_image&&this.partOptions.featured_image.height?this.partOptions.featured_image.height:60;this.parts.featured.addClass("ueditor_thumb ueditable").css({position:"relative","min-height":p+"px",width:"100%"}).append('<div class="upost_thumbnail_changer" ><div>'+Upfront.Settings.l10n.global.content.trigger_edit_featured_image+"</div></div>").find("img").css({"z-index":"2",position:"relative"})}this.parts.tags=this.$(".upfront-postpart-tags"),this.parts.categories=this.$(".upfront-postpart-categories"),setTimeout(function(){t.triggeredBy.length&&t.focus(t.triggeredBy,!0)},200)},getExcerptEditorOptions:function(){return{linebreaks:!1,autostart:!0,focus:!1,pastePlainText:!0,inserts:[],airButtons:["bold","italic"]}},getContentEditorOptions:function(){return{linebreaks:!1,replaceDivs:!1,autostart:!0,focus:!1,inserts:["postImage","embed"],insertsData:this.inserts,pastePlainText:!1}},editThumb:function(t){t.preventDefault();var n=this,r=e(t.target),i=this.postId,s=r.parent().find("img"),o=new Upfront.Views.Editor.Loading({loading:Upfront.Settings.l10n.global.content.starting_img_editor,done:Upfront.Settings.l10n.global.content.here_we_are,fixed:!1}),u=this.post.meta.getValue("_thumbnail_id");if(!u)return n.openImageSelector();o.render(),r.parent().append(o.$el),n.getImageInfo(n.post).done(function(e){o.$el.remove(),n.openImageEditor(!1,e,n.post.id)})},getImageInfo:function(t){var n=this,r=t.meta.get("_thumbnail_data"),i=t.meta.get("_thumbnail_id"),s=e.Deferred(),o=this.$(".ueditor_thumb").find("img");if(!r||!_.isObject(r.get("meta_value"))||r.get("meta_value").imageId!=i.get("meta_value")){if(!i)return!1;Upfront.Views.Editor.ImageEditor.getImageData([i.get("meta_value")]).done(function(e){var t=e.data.images,n={},r=0;_.each(t,function(e,t){n=e,r=t}),s.resolve({src:n.medium?n.medium[0]:n.full[0],srcFull:n.full[0],srcOriginal:n.full[0],fullSize:{width:n.full[1],height:n.full[2]},size:{width:o.width(),height:o.height()},position:{top:0,left:0},rotation:0,id:r})})}else{var u=r.get("meta_value"),a=o.width()/u.cropSize.width;s.resolve({src:u.src,srcFull:u.srcFull,srcOriginal:u.srcOriginal,fullSize:u.fullSize,size:{width:u.imageSize.width*a,height:u.imageSize.height*a},position:{top:u.imageOffset.top*a,left:u.imageOffset.left*a},rotation:u.rotation,id:u.imageId})}return s.promise()},openImageSelector:function(t){var n=this;Upfront.Views.Editor.ImageSelector.open().done(function(r){var i={},s=0;_.each(r,function(e,t){i=e,s=t});var o={src:i.medium?i.medium[0]:i.full[0],srcFull:i.full[0],srcOriginal:i.full[0],fullSize:{width:i.full[1],height:i.full[2]},size:i.medium?{width:i.medium[1],height:i.medium[2]}:{width:i.full[1],height:i.full[2]},position:!1,rotation:0,id:s};e("<img>").attr("src",o.srcFull).load(function(){Upfront.Views.Editor.ImageSelector.close(),n.openImageEditor(!0,o,t)})})},openImageEditor:function(t,n,r){var i=this,s=this.$(".ueditor_thumb"),o=_.extend({},n,{maskOffset:s.offset(),maskSize:{width:s.width(),height:s.height()},setImageSize:t,extraButtons:[{id:"image-edit-button-swap",text:Upfront.Settings.l10n.global.content.swap_image,callback:function(e,t){t.cancel(),i.openImageSelector(r)}}]});Upfront.Views.Editor.ImageEditor.open(o).done(function(t){var n=i.post,r=s.find("img"),o=e('<img style="z-index:2;position:relative">');i.post.meta.add([{meta_key:"_thumbnail_id",meta_value:t.imageId},{meta_key:"_thumbnail_data",meta_value:t}],{merge:!0}),r.length?(r.replaceWith(o),r=o):r=o.appendTo(s),r.attr("src",t.src)})},focus:function(t,n){var r="upfront-content-marker-";typeof t.length=="undefined"&&(t=e(t));if(t.hasClass(r+"title")||t.hasClass(r+"contents"))t.get(0).focus(),this.setSelection(t[0],n)},changeAuthor:function(e){var t=this,n=t.getAuthorData(e);this.$(".upfront-content-marker-author").html(n.display_name),this.postAuthor=e},editAuthor:function(t){t.preventDefault();var n=e(t.target);this.authorSelect.open(),this.authorSelect.$el.css({top:t.offsetY+50,left:t.offsetX+n.width(),display:"block"})},editDate:function(t){t.preventDefault();var n=e(t.target);this.datepicker.is(":visible")&&this.datepicker.offset({top:n.offset().top+30,left:n.offset().left+n.width()});var r=this.selectedDate||this.post.get("post_date");this.datepicker.parent().show().offset({top:n.offset().top+30,left:n.offset().left+n.width()});if(r){var i=r.getHours(),s=r.getMinutes();this.datepicker.datepicker("setDate",r),this.$(".ueditor-hours-select").val(i),this.$(".ueditor-minutes-select").val(s)}},getDateFormat:function(){return Upfront.Util.date.php_format_to_js(this.partOptions.date&&this.partOptions.date.format?this.partOptions.date.format:Upfront.data.date.format)},updateDateParts:function(t){this.parts.dates.html(e.datepicker.formatDate(this.getDateFormat(),t))},editDateCancel:function(){this.updateDateParts(this.selectedDate||this.post.get("post_date")),this.$(".upfront-date_picker").hide()},editDateOk:function(){var e=this.datepicker.datepicker("getDate"),t=this.datepicker.parent(),n=t.find(".ueditor-hours-select").val(),r=t.find(".ueditor-minutes-select").val();e.setHours(n),e.setMinutes(r),this.dateOk(e),this.$(".upfront-date_picker").hide()},dateOk:function(e){this.selectedDate=e},updateDateFromBar:function(e){this.updateDateParts(e),this.dateOk(e)},editTags:function(e){this.box.editTaxonomies(e,"post_tag")},editCategories:function(e){this.box.editTaxonomies(e,"category")},getAuthorData:function(e){var t=-1,n=!1,r=Upfront.data.ueditor.authors;while(++t<r.length&&!n)r[t].ID==e&&(n=r[t]);return n},updateStatus:function(e){this.postStatus=e},updateVisibility:function(e,t){this.postVisibility=e,this.postPassword=t},setSelection:function(e,t){var n,r;document.createRange?(n=document.createRange(),n.selectNodeContents(e),t||n.collapse(!1),r=window.getSelection(),r.removeAllRanges(),r.addRange(n)):document.selection&&(n=document.body.createTextRange(),n.moveToElementText(e),selectall||n.collapse(!1),n.select())},titleEdited:function(e){var t=e.target.innerHTML;this.parts.titles.each(function(){this!=e.target&&(this.innerHTML=t)})},contentEdited:function(t){var n=t.currentTarget.innerHTML;this.parts.contents.each(function(){this!=t.currentTarget&&e(this).redactor("set",n,!1)}),this.currentContent=t.currentTarget},prepareBox:function(){var e=this;if(this.box)return;return this.box=new t.Box({post:this.post}),this.bindBarEvents(),this.box.render(),this.$el.append(this.box.$el),_.delay(_.bind(this.box.setPosition,this.box),10),this.box.toggleRegionClass(!0),this},bindBarEvents:function(){var t=this,n=["cancel","publish","draft","trash","auto-draft"];_.each(n,function(n){t.listenTo(t.box,n,function(){var r={};if(n=="publish"||n=="draft"||n=="auto-draft"){t.parts.titles&&(r.title=e.trim(t.parts.titles.text()));if(t.currentContent){var i=e(t.currentContent).data("ueditor");t.$el.find(".upfront-inline-panel").remove(),t.$el.find(".ueditor-insert-remove").remove(),r.content=e.trim(i.getValue()),r.content=r.content.replace(/(\n)*?<br\s*\/?>\n*/g,"<br/>"),r.inserts=i.getInsertsData(),r.author=t.postAuthor}t.selectedDate&&(r.date=t.selectedDate),t.postStatus&&(r.status=t.postStatus),t.postVisibility&&(r.visibility=t.postVisibility),t.postPassword&&(r.pass=t.postPassword)}t.trigger(n,r)})}),this.listenTo(t.box.scheduleSection,"date:updated",t.updateDateFromBar).listenTo(t.box.statusSection,"status:change",t.updateStatus).listenTo(t.box.visibilitySection,"visibility:change",t.updateVisibility),Upfront.Events.on("editor:post:tax:updated",_.bind(t.refreshTaxonomies,t))},refreshTaxonomies:function(){if(!this.parts.tags.length&&!this.parts.categories.length)return;if(this.taxLoading)return;var e=this,t=this.postView.partOptions||{},n=this.postView.partTemplates||{},r={action:"content_part_markup",post_id:this.post.get("ID"),parts:[],templates:{}};this.parts.tags.length&&(r.parts.push({slug:"tags",options:t.tags||{}}),r.templates.tags=n.tags||""),this.parts.categories.length&&(r.parts.push({slug:"categories",options:t.categories||{}}),r.templates.categories=n.categories||""),r.parts=JSON.stringify(r.parts),setTimeout(function(){e.taxLoading=Upfront.Util.post(r).done(function(t){var n=e.postView.partContents;_.extend(n.replacements,t.data.replacements),_.extend(n.tpls,t.data.tpls),e.parts.tags.html(t.data.tpls.tags),e.parts.categories.html(t.data.tpls.categories),e.taxLoading=!1})},300)},stop:function(){this.box&&this.box.element_stop_prop&&Upfront.Events.off("upfront:element:edit:stop",this.box.element_stop_prop),this.onTitleEdited&&this.parts.titles.off("change",this.onTitleEdited),this.editors&&_.each(this.editors,function(e){e.stop()});var e=this.$el.closest(".ui-draggable");e.length&&(cancel=e.draggable("enable")),this.$("a").data("bypass",!1)},preventLinkNavigation:function(e){e.preventDefault()}}),s=Backbone.View.extend({tpl:!1,className:"ueditor-select ueditor-popup upfront-ui",events:{"blur input":"close","click .ueditor-select-option":"select"},initialize:function(e){this.opts=e.options,this.render()},render:function(){this.tpl||(this.tpl=this.getTpl()),this.tpl&&this.$el.html(this.tpl({options:this.opts}))},open:function(){var t=this;this.tpl||this.render(),this.$el.css("display","inline-block"),this.delegateEvents(),e(document).one("click",function(n){var r=t.$el.parent().length?t.$el.parent():t.$el,i=e(n.target);!i.is(r[0])&&!i.closest(r[0]).length&&t.close()})},close:function(e){var t=this;setTimeout(function(){t.$el.hide()},200)},select:function(t){t.preventDefault();var n=e(t.target).data("id");this.trigger("select",n),this.$("input").val("value"),this.$el.hide()},getTpl:function(){return this.tpl?this.tpl:Upfront.data&&Upfront.data.tpls?_.template(e(Upfront.data.tpls.popup).find("#microselect-tpl").html()):!1}});return{PostContentEditor:i,getMarkupper:function(){return r}}})})(jQuery);