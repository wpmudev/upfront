(function(e){define(["text!upfront/templates/post-editor/edition-box.html"],function(t){var n=Backbone.View.extend({className:"ueditor-box-wrapper upfront-ui",post:!1,taxSection:!1,offset:{min:0,max:0},position:{min:0,max:0},onScrollFunction:!1,statusSelect:!1,visibilitySelect:!1,taxSections:[],events:{"click .ueditor-action-preview":"navigate_to_preview","click .ueditor-button-cancel-edit":"cancel","click .ueditor-action-publish":"publish","click .ueditor-action-draft":"saveDraft","click .ueditor-action-trash":"trash","click .ueditor-box-title":"toggle_section","click .ueditor-save-post-data":"save_post_data"},initialize:function(n){var r=this;this.post=n.post,this.statusSection=new u({post:this.post}),this.visibilitySection=new a({post:this.post}),this.scheduleSection=new f({post:this.post}),this.urlEditor=new o({post:this.post}),this.tpl=_.template(e(t).find("#ueditor-box-main").html()),this.datepickerTpl=_.template(e(Upfront.data.tpls.popup).find("#datepicker-tpl").html()),Upfront.Events.trigger("upfront:element:edit:start","write",this.post),Upfront.Events.on("upfront:element:edit:stop",this.element_stop_prop,this)},element_stop_prop:function(){Upfront.Application.mode.current===Upfront.Application.MODE.POSTCONTENT&&Upfront.Application.current_subapplication.contentEditor&&e(".upfront-module").each(function(){e(this).is(".ui-draggable")&&e(this).draggable("disable"),e(this).is(".ui-resizable")&&e(this).resizable("disable")})},render:function(){this.destroy();if(!Upfront.Settings.Application.MODE.ALLOW.match(Upfront.Settings.Application.MODE.CONTENT))return!1;var e=this,t=this.post.toJSON(),n={},r=e.post.get("guid");return n.rootUrl=r?r.replace(/\?.*$/,""):window.location.origin+"/",t.permalink=this.permalink=n.rootUrl+this.post.get("post_name"),t.previewLink=this.post.get("guid")+"&preview=true",t.buttonText=this.getButtonText(),t.draftButton=["publish","future"].indexOf(this.initialStatus)==-1,t.cancelButton=!this.post.is_new,t.cid=this.cid,n.post_type_conditional_box_title=this._post_type_has_taxonomy("post_tag")&&this._post_type_has_taxonomy("category")?Upfront.Settings.l10n.global.content.tags_cats_url:Upfront.Settings.l10n.global.content.no_tax_url,this.$el.html(this.tpl(_.extend({},t,n))),this.populateSections(),this},navigate_to_preview:function(e){e.preventDefault();if(this.post.get("post_status")==="auto-draft"){this.post.trigger("editor:auto-draft"),this.trigger("auto-draft"),window.open(this.post.get("guid")+"&preview=true","_blank");return}window.open(this.post.get("guid"),"_blank")},renderTaxonomyEditor:function(e,t){var n=this,t=typeof t=="undefined"?"category":t,r=new Upfront.Collections.TermList([],{postId:this.post.id,taxonomy:t});if(!this._post_type_has_taxonomy(t))return e.hide(),!1;r.fetch({allTerms:!0}).done(function(o){var u=o.data.taxonomy.hierarchical?i:s,a=n.taxSections[t]=new u({collection:r,tax:t});a.allTerms=new Upfront.Collections.TermList(o.data.allTerms),a.render(),e.html(a.$el)})},populateSections:function(){this.$(".misc-pub-post-status").html(this.statusSection.$el),this.$(".misc-pub-visibility").html(this.visibilitySection.$el),this.$(".misc-pub-schedule").html(this.scheduleSection.$el),this.$(".misc-pub-section.misc-pub-post-url").html(this.urlEditor.$el),this.renderTaxonomyEditor(this.$(".misc-pub-post-category"),"category"),this.renderTaxonomyEditor(this.$(".misc-pub-post-tags"),"post_tag")},_post_type_has_taxonomy:function(e){if(!e)return!0;var t=this.post.get("post_type")||"post";return"page"!==t},getButtonText:function(){var e=this.initialStatus,t=this.post.get("post_date"),n=new Date;return t=t?t.getTime():0,n=n.getTime(),!e&&this.post&&this.post.get&&(e=this.post.get("post_status")),n<t?e=="future"?Upfront.Settings.l10n.global.content.update:Upfront.Settings.l10n.global.content.schedule:e=="publish"?Upfront.Settings.l10n.global.content.update:Upfront.Settings.l10n.global.content.publish},setPosition:function(){var t=e(".upfront-output-this_post").length?e(".upfront-output-this_post"):this.$el.closest(".upfront-postcontent-editor"),n=e("body").width()-(t.width()+(_.isUndefined(t.offset())?0:t.offset().left)),r=n>this.$el.width()?n-this.$el.width():10;this.$el.css({right:r+10})},toggleRegionClass:function(e){this.$el.closest(".upfront-region-container").toggleClass("upfront-region-container-editing-post",e)},destroy:function(){},_stop_overlay:function(){e(".editing-overlay").remove(),e(".upfront-module").removeClass("editing-content"),e(".upfront-module.fadedOut").fadeTo("slow",1).removeClass("fadedOut"),e(".ueditor-display-block").removeClass("ueditor-display-block")},cancel:function(e){e.preventDefault(),confirm(Upfront.Settings.l10n.global.content.discard_changes.replace(/%s/,this.post.get("post_title")))&&(this.toggleRegionClass(!1),this.destroy(),this.post.trigger("editor:cancel"),this.trigger("cancel"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post),Upfront.Application.sidebar.toggleSidebar(),this.fadein_other_elements())},fadein_other_elements:function(){e(".editing-overlay").remove(),e(".upfront-module").removeClass("editing-content"),e(".upfront-module.fadedOut").fadeTo("fast",1).removeClass("fadedOut"),e(".ueditor-display-block").removeClass("ueditor-display-block")},publish:function(e){e.preventDefault(),this.post.trigger("editor:publish"),this.trigger("publish"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post),Upfront.Events.trigger("upfront:post:edit:stop","write",this.post.toJSON()),this.fadein_other_elements(),this._stop_overlay(),Upfront.Application.sidebar.toggleSidebar(),this.toggleRegionClass(!1)},saveDraft:function(e){e.preventDefault(),this.destroy(),this.post.trigger("editor:draft"),this.trigger("draft"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post)},trash:function(e){e.preventDefault(),confirm(Upfront.Settings.l10n.global.content.delete_confirm.replace(/%s/,this.post.get("post_type")))&&(this.destroy(),this.trigger("trash"),Upfront.Events.trigger("upfront:element:edit:stop","write",this.post))},toggle_section:function(t){t.preventDefault();var n=e(t.target),r=n.closest(".ueditor-box-section"),i=r.find(".ueditor-box-content-wrap");r.toggleClass("show"),i.slideToggle()}}),r=Backbone.View.extend({events:{"click .ueditor-btn-edit":"toggleEditor","click .ueditor-button-cancel":"cancelEdit","click .ueditor-button-small-ok":"update",'change input[type="radio"][name="visibility"]':"visibility_radio_change","change input[name='visibility']":"set_visibility"},toggleEditor:function(t){t.preventDefault();var n=e(t.target),r=n.siblings(".ueditor-togglable"),i=n.closest(".misc-pub-section").find(".ueditor-previous-data-toggle");e(".ueditor-box-content-wrap .ueditor-togglable").not(r).slideUp(),e(".ueditor-box-content-wrap .ueditor-btn-edit").show(),e(".ueditor-previous-data-toggle").not(i).show(),i.hide(),n.hide(),r.slideDown(100)},cancelEdit:function(t){t.preventDefault();var n=e(t.target),r=n.closest(".misc-pub-section").find(".ueditor-previous-data-toggle");r.show(),n.closest(".ueditor-togglable").slideUp(100,function(){n.closest(".ueditor-togglable").siblings(".ueditor-btn-edit").show()})},visibility_radio_change:function(t){var n=e(t.target),r=n.val(),i=e(".ueditor-togglable-child-"+r);n.closest(".ueditor-togglable").find(".ueditor-togglable-child").not(i).hide(),i.show()}}),i=r.extend({termListingTpl:_.template(e(t).find("#upfront-term-list-tpl").html()),termSingleTpl:_.template(e(t).find("#upfront-term-single-tpl").html()),defaults:{title:"Categories"},className:"upfront-taxonomy-hierarchical",events:_.extend({},r.prototype.events,this.events,{"click #upfront-tax-add_term":"handle_new_term","click #add-new-taxonomies-btn":"toggle_add_new","keydown #upfront-add_term":"handle_enter_new_term","change .upfront-taxonomy_item":"handle_terms_update","keydown #upfront-new_term":"handle_enter_new_term","click .ueditor-save-post-hie-tax":"update"}),updateTimer:!1,allTerms:!1,initialize:function(e){this.tax=e.tax},render:function(){var e=this,t=e.collection.pluck("term_id"),n=this.allTerms.sortBy(function(e,n){return t.indexOf(e.get("term_id"))!==-1});this.$el.html(this.termListingTpl(_.extend({},this.defaults,{allTerms:this.allTerms.where({parent:"0"}),postTerms:this.collection,termTemplate:this.termSingleTpl,labels:this.collection.taxonomyObject.labels})))},handle_new_term:function(){var t=this,n=this.$(".upfront-tax-new_term"),r=n.val(),i,s;if(!r)return!1;e("#upfront-taxonomy-parents").length&&(i=e("#upfront-taxonomy-parents").val()),s=new Upfront.Models.Term({taxonomy:this.collection.taxonomy,name:r,parent:i}),s.save().done(function(e){t.allTerms.add(s),t.collection.add(s)});var o=this.termSingleTpl({term:s,termTemplate:t.termSingleTpl,termId:s.get("term_id"),postTerms:t.collection,selected:!0});this.$("#upfront-taxonomy-list").prepend(o),this.$("#upfront-taxonomy-list").scrollTop(0),n.val("")},handle_terms_update:function(t){var n=this,r=e(t.target),i=r.val();r.is(":checked")?this.collection.add(this.allTerms.get(i)):this.collection.remove(this.allTerms.get(i))},handle_enter_new_term:function(e){e.which==13&&this.handle_new_term(e)},update:function(e){this.collection.save(),Upfront.Events.trigger("editor:post:tax:updated",this.collection,this.tax),this.render()},toggle_add_new:function(){this.$(".ueditor-togglable-child").slideToggle()}}),s=r.extend({className:"upfront-taxonomy-flat",termListTpl:_.template(e(t).find("#upfront-flat-term-list-tpl").html()),termSingleTpl:_.template(e(t).find("#upfront-term-flat-single-tpl").html()),changed:!1,updateTimer:!1,events:_.extend({},r.prototype.events,{"click .ueditor-button-small-flat-tax-add":"handle_new_term","click .upfront-taxonomy_item-flat":"handle_term_click","keydown #upfront-flat-tax-add_term":"handle_enter_new_term","keydown .upfront-flat-tax-new_term":"handle_enter_new_term","click .upfront-taxonomy-list-choose-from-prev":"toggle_prev_used_tax"}),initialize:function(e){this.collection.on("add remove",this.update,this),this.tax=e.tax},render:function(){var e=this,t=new Upfront.Collections.TermList,n=new Upfront.Collections.TermList;this.allTerms.each(function(r,i){r.children=[],e.collection.get(r.get("term_id"))?t.add(r):n.add(r)}),this.$el.html(this.termListTpl({currentTerms:t,otherTerms:n,termTemplate:this.termSingleTpl,labels:this.collection.taxonomyObject.labels}))},handle_term_click:function(t){var n=this,r=e(t.currentTarget),i=r.attr("data-term_id");r.parent().attr("id")=="upfront-taxonomy-list-current"?this.collection.remove(i):this.collection.add(this.allTerms.get(i))},handle_new_term:function(e){e.preventDefault();var t=this,n=this.$(".upfront-flat-tax-new_term").val(),r;if(!n)return!1;r=new Upfront.Models.Term({taxonomy:this.collection.taxonomy,name:n}),r.save().done(function(e){t.allTerms.add(r),t.collection.add(r).save()})},handle_enter_new_term:function(e){e.which==13&&this.handle_new_term(e)},toggle_prev_used_tax:function(e){e.preventDefault(),this.$(".ueditor-togglable-child").slideToggle()},update:function(e){this.collection.save(),Upfront.Events.trigger("editor:post:tax:updated",this.collection,this.tax),this.render()}}),o=r.extend({hasDefinedSlug:!1,className:"upfront-slug_editor-url",tpl:_.template(e(t).find("#post-url-editor").html()),initialize:function(e){this.post=e.post,this.hasDefinedSlug=_.isEmpty(this.post.get("post_name"))?!1:!0,this.render()},render:function(){var e=this,t=this.post.get("guid");t=t?t.replace(/\?.*$/,""):window.location.origin+"/",this.$el.html(this.tpl({rootUrl:t,slug:e.post.get("post_name")}))},update:function(e){e.preventDefault();var t=this.$(".ueditor-post-url-text").val();t.length>1&&(this.post.set("post_name",t),this.hasDefinedSlug=!0,this.render())}}),u=r.extend({statusOptions:{future:{value:"future",name:Upfront.Settings.l10n.global.content.scheduled},publish:{value:"publish",name:Upfront.Settings.l10n.global.content.published},pending:{value:"pending",name:Upfront.Settings.l10n.global.content.pending_review},draft:{value:"draft",name:Upfront.Settings.l10n.global.content.draft},"private":{value:"private",name:Upfront.Settings.l10n.global.content.private_post},"auto-draft":{value:"auto-draft",name:Upfront.Settings.l10n.global.content.new_post},trash:{value:"trash",name:Upfront.Settings.l10n.global.content.deleted_post}},initialStatus:!1,tpl:_.template(e(t).find("#post-status-tpl").html()),initialize:function(e){this.post=e.post,this.render()},render:function(){return this.initialStatus=this.currentStatus=this.post.get("post_status"),this.status=this.getStatus(),this.options=this.getStatusOptions(),this.$el.html(this.tpl(_.extend({},this.post,{status:this.status},{options:this.options}))),this},getStatusOptions:function(e){var t=[],n=this.initialStatus;return n=="publish"?t.push(this.statusOptions.publish):n=="future"&&t.push(this.statusOptions.future),t.push(this.statusOptions.pending),t.push(this.statusOptions.draft),n=="private"&&(t=[this.statusOptions.private]),t},getStatus:function(){var e=this.post.get("post_status");return["auto-draft","draft","pending"].indexOf(e)!=-1?this.statusOptions[e]:this.statusOptions[this.initialStatus]},update:function(e){e.preventDefault();var t=this.$("select").val();!_.isEmpty(t)&&t!==this.initialStatus&&(this.post.set("post_status",t),this.trigger("status:change",t),this.render())}}),a=r.extend({tpl:_.template(e(t).find("#post-visibility-tpl").html()),post_password:"",postVisibility:!1,visibilityOptions:{"public":{value:"public",name:Upfront.Settings.l10n.global.content.public_post},sticky:{value:"sticky",name:Upfront.Settings.l10n.global.content.sticky},password:{value:"password",name:Upfront.Settings.l10n.global.content.protected_post},"private":{value:"private",name:Upfront.Settings.l10n.global.content.is_private}},initialize:function(e){this.post=e.post,this.render()},render:function(){return this.postVisibility=this.postVisibility?this.postVisibility:this.post.getVisibility(),this.status=this.visibilityOptions[this.postVisibility],this.postVisibility=="password"&&(this.post_password=this.post.get("post_password")),this.$el.html(this.tpl(_.extend({},this.post,{status:this.status,post_password:this.post_password}))),this},getVisibilityOptions:function(){var e=this.post.getVisibility(),t=this.visibilityOptions;return e=="password"?[{value:"password",name:Upfront.Settings.l10n.global.content.edit_pwd},t.public,t.sticky,t.private]:_.values(t)},set_visibility:function(t){var n=e(t.target).val();this.postVisibility=n},update:function(){var e=this.$(".ueditor-post-pass"),t=e.val();this.postVisibility=this.$("input[name='sticky']").is(":checked")?this.postVisibility="sticky":this.postVisibility;if(!this.visibilityOptions.hasOwnProperty(this.postVisibility))return;switch(this.postVisibility){case"password":if(t===""){e.css("border","1px solid red");return}e.css("border","1px solid #a3bfd9"),this.post.setVisibility(this.postVisibility),this.post.set("post_password",t),this.trigger("visibility:change","password",t);break;default:this.post.setVisibility(this.postVisibility),this.trigger("visibility:change",this.postVisibility,"")}this.render()}}),f=r.extend({tpl:_.template(e(t).find("#post-schedule-tpl").html()),initialize:function(e){this.post=e.post,this.render()},render:function(){var e=new Object;return this.initialDate=this.post.get("post_date"),e.currentMonth=this.initialDate.getMonth(),e.currentYear=this.initialDate.getFullYear(),e.currentDay=this.initialDate.getDate(),e.currentHour=this.initialDate.getHours(),e.currentMinute=this.initialDate.getMinutes(),this.schedule=this.getSchedule(),this.$el.html(this.tpl(_.extend({},this.post,e,{schedule:this.schedule}))),this},getSchedule:function(){var e=new Date,t=this.initialDate,n=Upfront.Util.format_date;return!t&&!this.initialDate?{key:Upfront.Settings.l10n.global.content.publish,text:Upfront.Settings.l10n.global.content.immediately}:t.getTime()==this.initialDate?t.getTime()<e.getTime()?{key:Upfront.Settings.l10n.global.content.published,text:n(t,!0)}:{key:Upfront.Settings.l10n.global.content.scheduled,text:n(t,!0)}:t.getTime()<e.getTime()?{key:Upfront.Settings.l10n.global.content.publish_on,text:n(t,!0)}:{key:Upfront.Settings.l10n.global.content.scheduled_for,text:n(t,!0)}},update:function(){var e=new Date,t=this.$("input[name='yy']").val(),n=this.$("select[name='mm']").val(),r=this.$("input[name='jj']").val(),i=this.$("input[name='hh']").val(),s=this.$("input[name='mn']").val();e.setFullYear(t),e.setMonth(n),e.setDate(r),e.setHours(i),e.setMinutes(s),this.post.set("post_date",e),this.trigger("date:updated",e),this.render()}});return{Box:n}})})(jQuery);