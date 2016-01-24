define(["scripts/upfront/settings/modules/base-module"],function(e){var t=Upfront.Settings.l10n.gallery_element,n=e.extend({className:"settings_module caption_location gallery-caption-location clearfix",group:!1,initialize:function(e){this.options=e||{};var n=this,r=this.options.state;this.fields=_([new Upfront.Views.Editor.Field.Checkboxes({model:this.model,className:"useCaptions checkbox-title",name:"use_captions",label:"",default_value:1,multiple:!1,values:[{label:t.panel.show_caption,value:"yes"}],change:function(e){n.model.set("use_captions",e)},show:function(e,t){var i=t.closest(".state_modules");if(e=="yes"){i.find("."+r+"-caption-select").show(),i.find("."+r+"-caption-trigger").show(),i.find("."+r+"-caption-height").show();var s=n.model.get("caption-height",e);s==="fixed"&&i.find("."+r+"-caption-height-number").show()}else i.find("."+r+"-caption-select").hide(),i.find("."+r+"-caption-trigger").hide(),i.find("."+r+"-caption-height").hide(),i.find("."+r+"-caption-height-number").hide()}}),new Upfront.Views.Editor.Field.Select({model:this.model,className:r+"-caption-select caption_select",name:"captionType",default_value:"below",label:t.panel.caption_location,values:[{value:"over",label:t.panel.over,icon:"over"},{value:"below",label:t.panel.under,icon:"below"}],change:function(e){n.model.set("captionType",e),e=="below"&&n.model.set("showCaptionOnHover","0")},show:function(e,t){var n=t.closest(".state_modules");e==="below"||typeof e=="undefined"?n.find(".gallery-caption-on-hover").hide():n.find(".gallery-caption-on-hover").show()}}),new Upfront.Views.Editor.Field.Radios({className:r+"-caption-trigger field-caption_trigger gallery-caption-on-hover upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field",model:this.model,name:"showCaptionOnHover",label:"",layout:"horizontal-inline",values:[{label:t.panel.always,value:"0"},{label:t.panel.hover,value:"1"}],change:function(e){n.model.set("showCaptionOnHover",e)}}),new Upfront.Views.Editor.Field.Radios({className:r+"-caption-height field-caption-height upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios",model:this.model,name:"caption-height",label:t.panel.caption_height,layout:"horizontal-inline",values:[{label:t.panel.auto,value:"auto"},{label:t.panel.fixed,value:"fixed"}],change:function(e){n.model.set("caption-height",e)},show:function(e,t){var i=t.closest(".state_modules"),s=n.model.get("use_captions");s==="yes"&&(e==="fixed"?i.find("."+r+"-caption-height-number").show():i.find("."+r+"-caption-height-number").hide())}}),new Upfront.Views.Editor.Field.Number({model:this.model,className:r+"-caption-height-number caption-height-number",name:"thumbCaptionsHeight",min:1,label:"",default_value:20,values:[{label:"px",value:"1"}],change:function(e){n.model.set("thumbCaptionsHeight",e)}})])}});return n});