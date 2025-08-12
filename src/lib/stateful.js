// Simple state machine implementation
(function(global) {
    // Stateful constructor
    function Stateful() {
        this.state = null;
        this.states = {};
    }
    
    // Prototype methods
    Stateful.prototype = {
        // Add a state
        addState: function(name, enterFn, updateFn, exitFn) {
            this.states[name] = {
                name: name,
                enter: enterFn || function() {},
                update: updateFn || function() {},
                exit: exitFn || function() {}
            };
            
            return this;
        },
        
        // Change to a new state
        changeState: function(newState) {
            // Exit current state
            if (this.state) {
                this.state.exit.call(this);
            }
            
            // Get the new state
            var state = this.states[newState];
            
            if (!state) {
                throw new Error("State '" + newState + "' does not exist!");
            }
            
            // Set current state
            this.state = state;
            
            // Enter new state
            this.state.enter.call(this);
            
            return this;
        },
        
        // Update current state
        update: function() {
            if (this.state) {
                this.state.update.apply(this, arguments);
            }
            
            return this;
        }
    };
    
    // Export to global namespace
    global.Stateful = Stateful;
})(window);