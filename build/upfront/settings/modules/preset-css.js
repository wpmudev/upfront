define(["scripts/upfront/settings/modules/base-module","scripts/upfront/preset-settings/preset-css-editor"],function(e,t){var s=Upfront.Settings.l10n.preset_manager,i=e.extend({className:"upfront-settings-css",events:{"click input[name=preset_css]":"openEditor"},initialize:function(t){var i=this;e.prototype.initialize.call(this,t),this.fields=_([new Upfront.Views.Editor.Field.Button({model:i.model,className:"edit_preset_label",compact:!0,label:s.edit_preset_label}),new Upfront.Views.Editor.Field.Button({model:i.model,className:"edit_preset_css",compact:!0,name:"preset_css",label:s.edit_preset_css})])},onPresetUpdate:function(e){this.trigger("upfront:presets:update",e,!1)},updateCss:function(e,t,s){t.replace(/'/g,'"'),e.set({preset_style:t})},openEditor:function(e){var s=this;e.preventDefault(),Upfront.Events.trigger("entity:settings:beforedeactivate");var i=Upfront.Application.cssEditor.getElementType(this.model),n=i.label.toLowerCase()+"-preset-"+this.options.preset.get("id");this.presetCSSEditor=new t({model:this.model,preset:this.options.preset,stylename:n});var r=_.debounce(this.updateCss,1e3);this.listenTo(this.presetCSSEditor,"upfront:presets:update",this.onPresetUpdate),this.listenTo(this.presetCSSEditor,"change",function(e){r(s.options.preset,e,s)}),Upfront.Events.trigger("entity:settings:deactivate")}});return i});