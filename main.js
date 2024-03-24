'use strict';

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
// const fs = require("fs");

const PpcHanAdapter = require('./lib/ppc.js');


class Han extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'han',
        });
        this.timer = null;
        this.isConnected = 0;
        this.on('ready', this.onReady.bind(this));
        // this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        this.log.debug('onReady called');
        // Reset the connection indicator during startup
        this.setState('info.connection', false, true);
        this.han = new PpcHanAdapter(this.config);
        this.readMeter();

    }

    readMeter() {
        this.log.debug('readMeter called');
        this.han.readMeter(this.config.meterid).then((meter_data) => {
            this.log.debug(`Got new data from smartmeter: ${meter_data.value}kWh`);
            this.setState("meter.value", meter_data.value, true);
            this.setState("meter.unit", meter_data.unit, true);
            this.setState("meter.timestamp", meter_data.timestamp, true);
            this.setState("meter.isvalid", meter_data.isvalid, true);
            this.setState("meter.name", meter_data.name, true);
            this.setState("meter.obis", meter_data.obis, true);
            this.setState("meter.fwversion", meter_data.fwversion, true);
            this.setState("meter.meterid", meter_data.meterid, true);
            this.setState("meter.updateinterval", meter_data.updateinterval, true);
            if (this.config.updateinterval == 0) this.config.updateinterval = meter_data.updateinterval * 1000;
            if (this.isConnected <= 0) {
                this.setState("info.connection", true, true);
                this.isConnected = 1;
            }
        }).catch((error) => {
            this.log.error(`Cannot read data from meter: ${error}`);
            this.log.debug(`timer is: ${this.timer}, connected: ${this.isConnected}`);
            if (this.isConnected == 0) {
                this.log.error('Stopping adapter');
                this.stop();
            } else {
                this.setState("info.connection", false, true);
                this.isConnected = -1;
            }
        });
        this.timer = setTimeout(() => this.readMeter(), this.config.updateinterval * 1000);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            if (this.timer) clearTimeout(this.timer);
            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     *
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
    */

}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Han(options);
} else {
    // otherwise start the instance directly
    new Han();
}