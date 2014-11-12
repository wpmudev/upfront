(function(e){define([],function(){var t=function(){this.parts={title:{replacements:["%title%","%permalink%"],editable:["%title%"]},contents:{replacements:["%contents%","%excerpt%"],editable:["%contents%","%excerpt%"]},excerpt:{replacements:["%excerpt%"],editable:["%excerpt%"]},author:{replacements:["%author%","%author_url%","%author_meta%"],editable:["%author%"],withParameters:["%author_meta_","%avatar_"]},categories:{replacements:["%categories%"],editable:[]},tags:{replacements:["%tags%"],editable:[]},comments_count:{replacements:["%comments_count%"],editable:[]},featured_image:{replacements:["%image%","%permalink%"],editable:["%image%"]},date:{replacements:["%date%","%date_iso%"],editable:["%date%"]},update:{replacements:["%update%","%date_iso%"],editable:["%update%"]}},this.markup=function(e,t,n,r){var i=this,s=r&&r.extraClasses?r.extraClasses:"",o=r&&r.attributes?r.attributes:{},u="";_.each(o,function(e,t){u+=t+'="'+e+'" '}),this.parts[e]&&this.parts[e].replacements&&_.each(this.parts[e].replacements,function(r){var o=t[r];i.parts[e].editable.indexOf(r)!==-1&&(o='<div class="upfront-content-marker upfront-content-marker-'+e+" "+s+'" '+u+">"+o+"</div>"),n=n.replace(r,o)});if(this.parts[e]&&this.parts[e].withParameters){var a=this.parts[e].withParameters;a&&_.each(a,function(e){var r=new RegExp(e+"[^%]+%","gm"),i=r.exec(n);_.each(i,function(e){n=typeof t[e]=="undefined"?"":n.replace(e,t[e])})})}return n}},n=new t,r=Backbone.View.extend({events:{"click a":"preventLinkNavigation","click .upfront-content-marker-author":"editAuthor","click .upfront-content-marker-date":"editDate","click .upost_thumbnail_changer":"editThumb","click .upfront-postpart-tags":"editTags","click .upfront-postpart-categories":"editCategories","click .ueditor-action-pickercancel":"editDateCancel","click .ueditor-action-pickerok":"editDateOk"},initialize:function(e){this.post=e.post,this.postView=e.postView,this.triggeredBy=e.triggeredBy||this.$(".upfront-content-marker").first(),this.parts={},this.partOptions=e.partOptions,this.postAuthor=this.post.get("post_author"),this.authorTpl=e.authorTpl,this.contentMode=e.content_mode,this.inserts=this.post.meta.getValue("_inserts_data")||{},this.$el.addClass("clearfix").css("padding-bottom","60px"),this.rawContent=e.rawContent,this.rawExcerpt=e.rawExcerpt,this.$("a").data("bypass",!0);var t=this.$el.closest(".ui-draggable");t.length&&(cancel=t.draggable("disable")),this.prepareEditableRegions(),this.prepareBar()},prepareEditableRegions:function(){var t=this;this.parts.titles=this.$(".upfront-content-marker-title");if(this.parts.titles.length){var n=this.parts.titles.parent();n.is("a")&&n.replaceWith(this.parts.titles),this.onTitleEdited=_.bind(this.titleEdited,this),this.parts.titles.attr("contenteditable",!0)}this.parts.contents=this.$(".upfront-content-marker-contents");if(this.parts.contents.length){var r=this.contentMode=="post_excerpt",i=r?this.rawExcerpt:this.rawContent,s=r?this.getExcerptEditorOptions():this.getContentEditorOptions();this.onContentsEdited=_.bind(this.contentEdited,this),this.editors=[],this.parts.contents.html(i).ueditor(s),this.parts.contents.on("keyup",this.onContentsEdited),this.parts.contents.each(function(){t.editors.push(e(this).data("ueditor"))}),this.currentContent=this.parts.contents[0]}this.parts.authors=this.$(".upfront-content-marker-author");if(this.parts.authors.length){var t=this,o=Upfront.data.ueditor.authors,a=[];_.each(o,function(e){a.push({value:e.ID,name:e.display_name})}),this.authorSelect=new u({options:a}),this.authorSelect.on("select",function(e){t.changeAuthor(e)}),this.$el.append(this.authorSelect.$el)}this.parts.dates=this.$(".upfront-content-marker-date");if(this.parts.dates.length){var t=this,f={},a=[],l=this.post.get("post_date"),c=this.getDateFormat();f.minutes=_.range(0,60),f.hours=_.range(0,24),f.currentHour=l.getHours(),f.currentMinute=l.getHours(),this.datepickerTpl=_.template(e(Upfront.data.tpls.popup).find("#datepicker-tpl").html()),this.$el.prepend(this.datepickerTpl(f)),this.datepicker=this.$(".upfront-bar-datepicker"),this.datepicker.datepicker({changeMonth:!0,changeYear:!0,dateFormat:c,onChangeMonthYear:function(n,r,i){var s=i.selectedDay,o=new Date(t.parts.dates.text()),u=new Date(n,r-1,s,o.getHours(),o.getMinutes());t.parts.dates.html(e.datepicker.formatDate(c,u)),t.post.set("post_date",u),t.datepicker.datepicker("setDate",u)},onSelect:function(e){t.parts.dates.html(e)}})}this.parts.featured=this.$(".upfront-content-marker-featured_image");if(this.parts.featured.length){var h=this.post.meta.getValue("_thumbnail_id"),p=this.partOptions.featured_image&&this.partOptions.featured_image.height?this.partOptions.featured_image.height:60;this.parts.featured.addClass("ueditor_thumb ueditable").css({position:"relative","min-height":p+"px",width:"100%"}).append('<div class="upost_thumbnail_changer" ><div>'+Upfront.Settings.l10n.global.content.trigger_edit_featured_image+"</div></div>").find("img").css({"z-index":"2",position:"relative"})}this.parts.tags=this.$(".upfront-postpart-tags"),this.parts.categories=this.$(".upfront-postpart-categories"),setTimeout(function(){t.triggeredBy.length&&t.focus(t.triggeredBy,!0)},200)},getExcerptEditorOptions:function(){return{linebreaks:!1,autostart:!0,focus:!1,pastePlainText:!0,airButtons:["bold","italic"]}},getContentEditorOptions:function(){return{linebreaks:!1,replaceDivs:!1,autostart:!0,focus:!1,pastePlainText:!1,inserts:this.inserts}},editThumb:function(t){t.preventDefault();var n=this,r=e(t.target),i=this.postId,s=r.parent().find("img"),o=new Upfront.Views.Editor.Loading({loading:Upfront.Settings.l10n.global.content.starting_img_editor,done:Upfront.Settings.l10n.global.content.here_we_are,fixed:!1}),u=this.post.meta.getValue("_thumbnail_id");if(!u)return n.openImageSelector();o.render(),r.parent().append(o.$el),n.getImageInfo(n.post).done(function(e){o.$el.remove(),n.openImageEditor(!1,e,n.post.id)})},getImageInfo:function(t){var n=this,r=t.meta.get("_thumbnail_data"),i=t.meta.get("_thumbnail_id"),s=e.Deferred(),o=this.$(".ueditor_thumb").find("img");if(!r||!_.isObject(r.get("meta_value"))||r.get("meta_value").imageId!=i.get("meta_value")){if(!i)return!1;Upfront.Views.Editor.ImageEditor.getImageData([i.get("meta_value")]).done(function(e){var t=e.data.images,n={},r=0;_.each(t,function(e,t){n=e,r=t}),s.resolve({src:n.medium?n.medium[0]:n.full[0],srcFull:n.full[0],srcOriginal:n.full[0],fullSize:{width:n.full[1],height:n.full[2]},size:{width:o.width(),height:o.height()},position:{top:0,left:0},rotation:0,id:r})})}else{var u=r.get("meta_value"),a=o.width()/u.cropSize.width;s.resolve({src:u.src,srcFull:u.srcFull,srcOriginal:u.srcOriginal,fullSize:u.fullSize,size:{width:u.imageSize.width*a,height:u.imageSize.height*a},position:{top:u.imageOffset.top*a,left:u.imageOffset.left*a},rotation:u.rotation,id:u.imageId})}return s.promise()},openImageSelector:function(t){var n=this;Upfront.Views.Editor.ImageSelector.open().done(function(r){var i={},s=0;_.each(r,function(e,t){i=e,s=t});var o={src:i.medium?i.medium[0]:i.full[0],srcFull:i.full[0],srcOriginal:i.full[0],fullSize:{width:i.full[1],height:i.full[2]},size:i.medium?{width:i.medium[1],height:i.medium[2]}:{width:i.full[1],height:i.full[2]},position:!1,rotation:0,id:s};e("<img>").attr("src",o.srcFull).load(function(){Upfront.Views.Editor.ImageSelector.close(),n.openImageEditor(!0,o,t)})})},openImageEditor:function(t,n,r){var i=this,s=this.$(".ueditor_thumb"),o=_.extend({},n,{maskOffset:s.offset(),maskSize:{width:s.width(),height:s.height()},setImageSize:t,extraButtons:[{id:"image-edit-button-swap",text:Upfront.Settings.l10n.global.content.swap_image,callback:function(e,t){t.cancel(),i.openImageSelector(r)}}]});Upfront.Views.Editor.ImageEditor.open(o).done(function(t){var n=i.post,r=s.find("img"),o=e('<img style="z-index:2;position:relative">');i.post.meta.add([{meta_key:"_thumbnail_id",meta_value:t.imageId},{meta_key:"_thumbnail_data",meta_value:t}],{merge:!0}),r.length?(r.replaceWith(o),r=o):r=o.appendTo(s),r.attr("src",t.src)})},focus:function(t,n){var r="upfront-content-marker-";typeof t.length=="undefined"&&(t=e(t));if(t.hasClass(r+"title")||t.hasClass(r+"contents"))t.get(0).focus(),this.setSelection(t[0],n)},changeAuthor:function(e){var t=this,n=t.getAuthorData(e);this.$(".upfront-content-marker-author").html(n.display_name),this.postAuthor=e},editAuthor:function(t){t.preventDefault();var n=e(t.target);this.authorSelect.open(),this.authorSelect.$el.css({top:t.offsetY+50,left:t.offsetX+n.width(),display:"block"})},editDate:function(t){t.preventDefault();var n=e(t.target);console.log("editDate"),this.datepicker.is(":visible")&&this.datepicker.offset({top:n.offset().top+30,left:n.offset().left+n.width()});var r=this.selectedDate||this.post.get("post_date");this.datepicker.parent().show().offset({top:n.offset().top+30,left:n.offset().left+n.width()});if(r){var i=r.getHours(),s=r.getMinutes();this.datepicker.datepicker("setDate",r),this.$(".ueditor-hours-select").val(i),this.$(".ueditor-minutes-select").val(s)}},getDateFormat:function(){return Upfront.Util.date.php_format_to_js(this.partOptions.date&&this.partOptions.date.format?this.partOptions.date.format:Upfront.data.date.format)},updateDateParts:function(t){this.parts.dates.html(e.datepicker.formatDate(this.getDateFormat(),t))},editDateCancel:function(){this.updateDateParts(this.selectedDate||this.post.get("post_date")),this.$(".upfront-date_picker").hide()},editDateOk:function(){var e=this.datepicker.datepicker("getDate"),t=this.datepicker.parent(),n=t.find(".ueditor-hours-select").val(),r=t.find(".ueditor-minutes-select").val();e.setHours(n),e.setMinutes(r),this.dateOk(e),this.$(".upfront-date_picker").hide()},dateOk:function(e){this.selectedDate=e},updateDateFromBar:function(e){this.updateDateParts(e),this.dateOk(e)},editTags:function(e){this.bar.editTaxonomies(e,"post_tag")},editCategories:function(e){this.bar.editTaxonomies(e,"category")},getAuthorData:function(e){var t=-1,n=!1,r=Upfront.data.ueditor.authors;while(++t<r.length&&!n)r[t].ID==e&&(n=r[t]);return n},updateStatus:function(e){this.postStatus=e},updateVisibility:function(e,t){this.postVisibility=e,this.postPassword=t},setSelection:function(e,t){var n,r;document.createRange?(n=document.createRange(),n.selectNodeContents(e),t||n.collapse(!1),r=window.getSelection(),r.removeAllRanges(),r.addRange(n)):document.selection&&(n=document.body.createTextRange(),n.moveToElementText(e),selectall||n.collapse(!1),n.select())},titleEdited:function(e){var t=e.target.innerHTML;this.parts.titles.each(function(){this!=e.target&&(this.innerHTML=t)})},contentEdited:function(t){var n=t.currentTarget.innerHTML;this.parts.contents.each(function(){this!=t.currentTarget&&e(this).redactor("set",n,!1)}),this.bar.calculateLimits(),this.currentContent=t.currentTarget},prepareBar:function(){if(this.bar){this.bar.calculateLimits();return}this.bar=new i({post:this.post}),this.bindBarEvents(),this.bar.render(),this.$el.append(this.bar.$el),this.bar.stick();return},bindBarEvents:function(){var t=this,n=["cancel","publish","draft","trash"];_.each(n,function(n){t.listenTo(t.bar,n,function(){var r={};if(n=="publish"||n=="draft"){t.parts.titles&&(r.title=e.trim(t.parts.titles.text()));if(t.currentContent){var i=e(t.currentContent).data("ueditor");r.content=e.trim(i.getValue()),r.inserts=i.getInsertsData(),r.author=t.postAuthor}t.selectedDate&&(r.date=t.selectedDate),t.postStatus&&(r.status=t.postStatus),t.postVisibility&&(r.visibility=t.postVisibility),t.postPassword&&(r.pass=t.postPassword)}t.trigger(n,r)})}),this.listenTo(t.bar,"date:updated",t.updateDateFromBar).listenTo(t.bar,"date:cancel",t.editDateCancel).listenTo(t.bar,"status:change",t.updateStatus).listenTo(t.bar,"visibility:change",t.updateVisibility).listenTo(t.bar,"tax:refresh",t.refreshTaxonomies)},refreshTaxonomies:function(){if(!this.parts.tags.length&&!this.parts.categories.length)return;if(this.taxLoading)return;var e=this,t=this.postView.partOptions||{},n=this.postView.partTemplates||{},r={action:"content_part_markup",post_id:this.post.get("ID"),parts:[],templates:{}};this.parts.tags.length&&(r.parts.push({slug:"tags",options:t.tags||{}}),r.templates.tags=n.tags||""),this.parts.categories.length&&(r.parts.push({slug:"categories",options:t.categories||{}}),r.templates.categories=n.categories||""),r.parts=JSON.stringify(r.parts),setTimeout(function(){e.taxLoading=Upfront.Util.post(r).done(function(t){var n=e.postView.partContents;_.extend(n.replacements,t.data.replacements),_.extend(n.tpls,t.data.tpls),e.parts.tags.html(t.data.tpls.tags),e.parts.categories.html(t.data.tpls.categories),e.taxLoading=!1})},300)},stop:function(){this.onTitleEdited&&this.parts.titles.off("change",this.onTitleEdited),this.editors&&_.each(this.editors,function(e){e.stop()});var e=this.$el.closest(".ui-draggable");e.length&&(cancel=e.draggable("enable")),this.$("a").data("bypass",!1)},preventLinkNavigation:function(e){e.preventDefault()}}),i=Backbone.View.extend({className:"ueditor-bar-wrapper upfront-ui",post:!1,offset:{min:0,max:0},position:{min:0,max:0},onScrollFunction:!1,statusOptions:{future:{value:"future",name:Upfront.Settings.l10n.global.content.scheduled},publish:{value:"publish",name:Upfront.Settings.l10n.global.content.published},pending:{value:"pending",name:Upfront.Settings.l10n.global.content.pending_review},draft:{value:"draft",name:Upfront.Settings.l10n.global.content.draft},"private":{value:"private",name:Upfront.Settings.l10n.global.content.private_post},"auto-draft":{value:"auto-draft",name:Upfront.Settings.l10n.global.content.new_post},trash:{value:"trash",name:Upfront.Settings.l10n.global.content.deleted_post}},visibilityOptions:{"public":{value:"public",name:Upfront.Settings.l10n.global.content.public_post},sticky:{value:"sticky",name:Upfront.Settings.l10n.global.content.sticky},password:{value:"password",name:Upfront.Settings.l10n.global.content.protected_post},"private":{value:"private",name:Upfront.Settings.l10n.global.content.is_private}},statusSelect:!1,visibilitySelect:!1,initialStatus:!1,events:{"click .ueditor-action-cancel":"cancel","click .ueditor-action-publish":"publish","click .ueditor-action-draft":"saveDraft","click .ueditor-action-trash":"trash","click .ueditor-action-url":"editUrl","click .ueditor-action-tags":"editTaxonomies","click .ueditor-select-value":"editSelect","click .ueditor-pass-ok":"changePass","click .ueditor-action-schedule":"openDatepicker","click .ueditor-bar-show_advanced":"toggleAdvanced","click .ueditor-action-pickercancel":"close_date_picker","click .ueditor-action-pickerok":"save_date_picker","change .ueditor-hours-select":"set_time","change .ueditor-minutes-select":"set_time"},initialize:function(t){var n=this;this.post=t.post,this.initialStatus=this.post.get("post_status"),this.currentStatus=this.initialStatus,this.postVisibility=this.post.getVisibility(),this.postVisibility=="password"&&(this.postPassword=this.post.get("post_password")),this.initialDate=this.post.get("post_date"),this.tpl=_.template(Upfront.data.uposts.barTemplate),this.datepickerTpl=_.template(e(Upfront.data.tpls.popup).find("#datepicker-tpl").html()),Upfront.Events.trigger("upfront:element:edit:start","write",this.post)},render:function(){this.destroy();if(!Upfront.Settings.Application.MODE.ALLOW.match(Upfront.Settings.Application.MODE.CONTENT))return!1;var t=this,n=this.post.toJSON(),r=this.initialDate,i={};n.status=this.getBarStatus(),n.visibility=this.visibilityOptions[this.postVisibility],n.schedule=this.getSchedule(),n.buttonText=this.getButtonText(),n.draftButton=["publish","future"].indexOf(this.initialStatus)==-1,n.cancelButton=!this.post.is_new,n.cid=this.cid,i.minutes=_.range(0,60),i.hours=_.range(0,24),i.currentHour=r.getHours(),i.currentMinute=r.getHours(),n.datepicker=this.datepickerTpl(i),this.$el.html(this.tpl(n)),this.$(".upfront-bar-datepicker").datepicker({changeMonth:!0,changeYear:!0,dateFormat:"yy/mm/dd",onChangeMonthYear:function(e,n){var r=t.$(".upfront-bar-datepicker"),i=r.datepicker("getDate").getDate(),s=new Date(t.$(".ueditor-action-schedule").text()),o=new Date(e,n-1,i,s.getHours(),s.getMinutes());t.$(".ueditor-action-schedule").html(Upfront.Util.format_date(o,!0)),t.post.set("post_date",o),r.datepicker("setDate",o)},onSelect:function(e){t.updateBarDate(t.getDatepickerDate())}}),this.prepareSelectBoxes(),e("#"+this.cid).length&&this.stick()},prepareSelectBoxes:function(){var e=this;this.statusSelect=new u({options:this.getStatusOptions()}),this.visibilitySelect=new u({options:this.getVisibilityOptions()}),this.statusSelect.on("select",function(t){e.currentStatus=t,e.trigger("status:change",t),e.render(),e.toggleAdvanced()}),this.visibilitySelect.on("select",function(t){t=="password"?e.showPassEditor(e.$(".ueditor-select-visibility")):(e.trigger("visibility:change",t),e.postVisibility=t,e.render(),e.toggleAdvanced())}),this.$(".ueditor-select-visibility").append(this.visibilitySelect.$el),this.$(".ueditor-select-status").append(this.statusSelect.$el)},getBarStatus:function(){var e=this.currentStatus;return["auto-draft","draft","pending"].indexOf(e)!=-1?this.statusOptions[e]:this.statusOptions[this.initialStatus]},getSchedule:function(){var e=new Date,t=this.initialDate,n=Upfront.Util.format_date;return!t&&!this.initialDate?{key:Upfront.Settings.l10n.global.content.publish,text:Upfront.Settings.l10n.global.content.immediately}:t.getTime()==this.initialDate?t.getTime()<e.getTime()?{key:Upfront.Settings.l10n.global.content.published,text:n(t,!0)}:{key:Upfront.Settings.l10n.global.content.scheduled,text:n(t,!0)}:t.getTime()<e.getTime()?{key:Upfront.Settings.l10n.global.content.publish_on,text:n(t,!0)}:{key:Upfront.Settings.l10n.global.content.schedule,text:n(t,!0)}},openDatepicker:function(e){var t=this.initialDate;this.$(".upfront-date_picker").toggle(),t&&this.$(".ueditor-action-schedule").html(Upfront.Util.format_date(t,!0))},close_date_picker:function(){this.trigger("date:cancel"),this.updateBarDate(this.initialDate),this.$(".upfront-date_picker").hide()},save_date_picker:function(){var e=this.getDatepickerDate();this.initialDate=e,this.trigger("date:updated",e),this.$(".upfront-date_picker").hide(),this.render(),this.toggleAdvanced()},set_time:function(e){this.updateBarDate(this.getDatepickerDate())},updateBarDate:function(e){this.$(".ueditor-action-schedule").html(Upfront.Util.format_date(e,!0))},getDatepickerDate:function(){var e=this.$(".upfront-bar-datepicker").datepicker("getDate"),t=this.$(".ueditor-hours-select").val(),n=this.$(".ueditor-minutes-select").val();return e.setHours(t),e.setMinutes(n),e},getStatusOptions:function(e){var t=[],n=this.initialStatus;return n=="publish"?t.push(this.statusOptions.publish):n=="future"&&t.push(this.statusOptions.future),t.push(this.statusOptions.pending),t.push(this.statusOptions.draft),n=="private"&&(t=[this.statusOptions.private]),t},getVisibilityOptions:function(){var e=this.post.getVisibility(),t=this.visibilityOptions;return e=="password"?[{value:"password",name:Upfront.Settings.l10n.global.content.edit_pwd},t.public,t.sticky,t.private]:_.values(t)},getButtonText:function(){var e=this.initialStatus,t=this.post.get("post_date"),n=new Date;return t=t?t.getTime():0,n=n.getTime(),n<t?e=="future"?Upfront.Settings.l10n.global.content.update:Upfront.Settings.l10n.global.content.schedule:e=="publish"?Upfront.Settings.l10n.global.content.update:Upfront.Settings.l10n.global.content.publish},calculateLimits:function(){var e=this.$(".ueditor-bar-ph"),t=this.$el.parent();if(!t.length)return!1;var n=t.height();if(n==this.containerHeight)return;var r=t.offset().top;this.position={min:100,max:n},this.offset={min:this.position.min+r,max:this.position.max+r+2*this.$el.height()},this.onScroll(null,this.$(".ueditor-bar"))},onScroll:function(t,n){var r=this,i=e(window).scrollTop()+e(window).height(),s=n.css("position");s=="fixed"?i<=r.offset.min?(n.css({position:"absolute",bottom:"auto",top:r.position.min+"px",left:0,width:"100%",opacity:1}).removeClass("floating"),r.calculateLimits()):i>=r.offset.max&&(n.css({position:"absolute",bottom:"auto",top:"100%",left:0,width:"100%",opacity:1}).removeClass("floating"),r.calculateLimits()):s=="absolute"&&i<r.offset.max&&i>r.offset.min&&(n.css({position:"fixed",bottom:"0px",left:n.offset().left+"px",top:"auto",width:n.outerWidth()+"px",opacity:.4}).addClass("floating").removeClass("show-advanced"),r.calculateLimits())},stick:function(){var t=this.$(".ueditor-bar-ph"),n=this.$(".ueditor-bar"),r=this.$el.parent(),i=this;t.height(n.height()),r.css("position","relative"),n.css({position:"absolute",bottom:"0",left:"0",width:"100%"}),this.calculateLimits(),this.onScrollFunction=function(e){i.onScroll(e,n)},e(window).on("scroll",this.onScrollFunction).on("resize",this.onScrollFunction),this.onScroll(null,n)},destroy:function(){e(window).off("scroll",this.onScrollFunction).off("resize",this.onScrollFunction),this.onScrollFunction=!1},cancel:function(e){e.preventDefault(),confirm(Upfront.Settings.l10n.global.content.discard_changes.replace(/%s/,this.post.get("post_title")))&&(this.destroy(),this.post.trigger("editor:cancel"),this.trigger("cancel"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post))},publish:function(e){e.preventDefault(),this.destroy(),this.post.trigger("editor:publish"),this.trigger("publish"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post)},saveDraft:function(e){e.preventDefault(),this.destroy(),this.post.trigger("editor:draft"),this.trigger("draft"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post)},trash:function(e){e.preventDefault(),confirm(Upfront.Settings.l10n.global.content.delete_confirm.replace(/%s/,this.post.get("post_type")))&&(this.destroy(),this.trigger("trash"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post))},editUrl:function(t){t.preventDefault();var n=this,r={},i=Upfront.Popup.open(function(t,n,i){var s=e(this);s.empty().append('<p class="upfront-popup-placeholder">'+Upfront.Settings.l10n.global.content.popup_loading+"</p>"),r={top:n,content:s,bottom:i}}),s=function(e){n.post.set("post_name",e),Upfront.Popup.close()},o=_.template(e(Upfront.data.tpls.popup).find("#upfront-slug-tpl").html()),u=n.post.get("guid");u=u?u.replace(/\?.*$/,""):window.location.origin+"/",r.content.html(o({rootURL:u,slug:n.post.get("post_name")})),r.content.off("click","#upfront-post_slug-send").on("click","#upfront-post_slug-send",function(){s(e("#upfront-post_slug").val())}).off("keydown","#upfront-post_slug").on("keydown","#upfront-post_slug",function(t){t.which==13&&(t.preventDefault(),s(e("#upfront-post_slug").attr("disabled",!0).val()))})},editTaxonomies:function(t,n){t&&t.preventDefault();var r=this,i=e("body").append('<div id="upfront-post_taxonomies" style="display:none" />'),u=e("#upfront-post_taxonomies"),a={},f={category:!1,post_tag:!1},l=n||"category",c={},h=Upfront.Popup.open(function(t,n,r){var i=e(this);i.empty().append('<p class="upfront-popup-placeholder">'+Upfront.Settings.l10n.global.content.popup_loading+"</p>").append(u),a={top:n,content:i,bottom:r}}),p=function(t){var n=e(t),i=n.attr("data-type"),u=n.attr("rel"),h=c[i]?c[i]:!1;return a.top.find(".upfront-tabs li").removeClass("active"),n.addClass("active"),l=i,f[i]?d(f[i]):(h||(h=new Upfront.Collections.TermList([],{postId:r.post.id,taxonomy:i}),c[i]=h),a.content.html('<p class="upfront-popup-placeholder">'+Upfront.Settings.l10n.global.content.popup_loading+"</p>"),h.fetch({allTerms:!0}).done(function(e){var t=e.data.taxonomy.hierarchical?s:o,n=new t({collection:h});n.allTerms=new Upfront.Collections.TermList(e.data.allTerms),f[i]=n,d()}),r.listenToOnce(Upfront.Events,"popup:closed",r.refreshTaxonomies),!1)},d=function(e){var t=f[l];t.render(),a.content.html(t.$el),t.setElement(t.$el)};e(".upfront-popup-placeholder").remove(),a.top.html('<ul class="upfront-tabs"><li data-type="category" class="tax-category">'+Upfront.Settings.l10n.global.content.categories+"</li>"+'<li data-type="post_tag" class="tax-post_tag">'+Upfront.Settings.l10n.global.content.tags+"</li>"+"</ul>"+a.top.html()),a.top.find(".upfront-tabs li").on("click",function(){p(this)}),u.show(),p(a.top.find(".tax-"+l)),Upfront.Events.on("upfront:post:taxonomy_changed",function(){p(a.top.find(".upfront-tabs li.active"))})},editSelect:function(t){t.preventDefault();var n=e(t.target).data("id");this[n+"Select"].open()},showPassEditor:function(e){var t=this.visibilityOptions.password,n=this;e.find(".ueditor-select-value").data("id",t.value).text(t.name),e.find(".ueditor-select-options").hide(),e.find(".ueditor-pass-editor").show().find("input").val(this.postPassword||"").one("blur",function(e){setTimeout(function(){n.render()},300)}).off("keydown").on("keydown",function(e){e.which==13&&n.changePass(e)}).focus()},changePass:function(t){var n=e(t.target).parent().find("input").val();n&&(this.trigger("visibility:change","password",n),this.postVisibility="password",this.postPassword=n,this.render(),this.toggleAdvanced())},toggleAdvanced:function(e){e&&e.preventDefault(),this.$(".ueditor-bar").toggleClass("show-advanced")},refreshTaxonomies:function(){this.trigger("tax:refresh")}}),s=Backbone.View.extend({className:"upfront-taxonomy-hierarchical",events:{"click #upfront-add_term":"handle_new_term","keydown #upfront-add_term":"handle_enter_new_term","change .upfront-taxonomy_item":"handle_terms_update","keydown #upfront-new_term":"handle_enter_new_term"},termListTpl:!1,termSingleTpl:!1,updateTimer:!1,allTerms:!1,initialize:function(t){this.termListTpl=_.template(e(Upfront.data.tpls.popup).find("#upfront-term-list-tpl").html()),this.termSingleTpl=_.template(e(Upfront.data.tpls.popup).find("#upfront-term-single-tpl").html())},render:function(){this.$el.html(this.termListTpl({allTerms:this.allTerms,postTerms:this.collection,termTemplate:this.termSingleTpl,labels:this.collection.taxonomyObject.labels}))},handle_new_term:function(){var t=this,n=this.$el.find("#upfront-new_term").val(),r,i;if(!n)return!1;e("#upfront-taxonomy-parents").length&&(r=e("#upfront-taxonomy-parents").val()),i=new Upfront.Models.Term({taxonomy:this.collection.taxonomy,name:n,parent:r}),i.save().done(function(e){t.allTerms.add(i),t.collection.add(i).save(),t.render()})},handle_terms_update:function(t){var n=this,r=e(t.target),i=r.val();r.is(":checked")?this.collection.add(this.allTerms.get(i)):this.collection.remove(this.allTerms.get(i)),clearTimeout(this.updateTimer),this.updateTimer=setTimeout(function(){n.collection.save()},2e3)},handle_enter_new_term:function(e){e.which==13&&this.handle_new_term(e)}}),o=Backbone.View.extend({className:"upfront-taxonomy-flat",termListTpl:!1,termSingleTpl:!1,changed:!1,updateTimer:!1,events:{"click #upfront-add_term":"handle_new_term","click .upfront-taxonomy_item-flat":"handle_term_click","keydown #upfront-add_term":"handle_enter_new_term","keydown #upfront-new_term":"handle_enter_new_term"},initialize:function(t){this.collection.on("add remove",this.render,this),this.termListTpl=_.template(e(Upfront.data.tpls.popup).find("#upfront-flat-term-list-tpl").html()),this.termSingleTpl=_.template(e(Upfront.data.tpls.popup).find("#upfront-term-flat-single-tpl").html())},render:function(){var e=this,t=[],n=[];this.allTerms.each(function(r,i){r.children=[],e.collection.get(r.get("term_id"))?t.push(r):n.push(r)}),this.$el.html(this.termListTpl({currentTerms:t,otherTerms:n,termTemplate:this.termSingleTpl,labels:this.collection.taxonomyObject.labels}))},handle_term_click:function(t){var n=this,r=e(t.currentTarget),i=r.attr("data-term_id");r.parent().attr("id")=="upfront-taxonomy-list-current"?this.collection.remove(i):this.collection.add(this.allTerms.get(i)),clearTimeout(this.updateTimer),this.updateTimer=setTimeout(function(){n.collection.save()},2e3)},handle_new_term:function(e){var t=this,n=this.$el.find("#upfront-new_term").val(),r;e.preventDefault();if(!n)return!1;r=new Upfront.Models.Term({taxonomy:this.collection.taxonomy,name:n}),r.save().done(function(e){t.allTerms.add(r),t.collection.add(r).save()})},handle_enter_new_term:function(e){e.which==13&&this.handle_new_term(e)}}),u=Backbone.View.extend({tpl:!1,className:"ueditor-select ueditor-popup upfront-ui",events:{"blur input":"close","click .ueditor-select-option":"select"},initialize:function(e){this.opts=e.options,this.render()},render:function(){this.tpl||(this.tpl=this.getTpl()),this.tpl&&this.$el.html(this.tpl({options:this.opts}))},open:function(){var t=this;this.tpl||this.render(),this.$el.css("display","inline-block"),this.delegateEvents(),e(document).one("click",function(n){var r=t.$el.parent().length?t.$el.parent():t.$el,i=e(n.target);!i.is(r[0])&&!i.closest(r[0]).length&&t.close()})},close:function(e){var t=this;setTimeout(function(){t.$el.hide()},200)},select:function(t){t.preventDefault();var n=e(t.target).data("id");this.trigger("select",n),this.$("input").val("value"),this.$el.hide()},getTpl:function(){return this.tpl?this.tpl:Upfront.data&&Upfront.data.tpls?_.template(e(Upfront.data.tpls.popup).find("#microselect-tpl").html()):!1}});return{PostContentEditor:r,getMarkupper:function(){return n}}})})(jQuery);