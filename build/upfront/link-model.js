upfrontrjs.define([],function(){var t=Backbone.Model.extend({defaults:{type:"unlink",url:"",target:"_self"},initialize:function(){this.on("change:type",this.updateTarget,this)},updateTarget:function(){_.contains(["lightbox","anchor"],this.get("type"))&&(console.log("we have an anchor or a lightbox"),this.set({target:"_self"},{silent:!0}))}});return t});