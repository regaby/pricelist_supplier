odoo.define('pricelist_supplier', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    //var _super_order = models.Order.prototype;
    var utils = require('web.utils');
    var round_pr = utils.round_precision;
    models.load_fields('product.product', ['supplier_id']);

    // // Make place persistent in the session
    models.Product = models.Product.extend({
        get_price: function(pricelist, quantity){

            console.log('pricelist...............', pricelist);
            var self = this;
            var date = moment().startOf('day');

            // In case of nested pricelists, it is necessary that all pricelists are made available in
            // the POS. Display a basic alert to the user in this case.
            if (pricelist === undefined) {
                alert(_t(
                    'An error occurred when loading product prices. ' +
                    'Make sure all pricelists are available in the POS.'
                ));
            }

            var category_ids = [];
            console.log('this.categ', this.categ);
            console.log('this.supplier', this.supplier);
            console.log('this.supplier_id', this.supplier_id);
            var category = this.categ;
            while (category) {
                console.log('category.........', category);
                category_ids.push(category.id);
                category = category.parent;
            }
            console.log('category_ids', category_ids);


            var supplier_ids = [];
            var supplier = this.supplier_id;
            while (supplier) {
                console.log('supplier.........', supplier);
                supplier_ids.push(supplier[0]);
                supplier = supplier.parent;
            }
            console.log('supplier_ids',supplier_ids);

            var pricelist_items = _.filter(pricelist.items, function (item) {
                console.log('item.supplier_id',item.supplier_id);
                return (! item.product_tmpl_id || item.product_tmpl_id[0] === self.product_tmpl_id) &&
                       (! item.product_id || item.product_id[0] === self.id) &&
                       (! item.categ_id || _.contains(category_ids, item.categ_id[0])) &&
                       (! item.supplier_id || _.contains(supplier_ids, item.supplier_id[0])) &&
                       (! item.date_start || moment(item.date_start).isSameOrBefore(date)) &&
                       (! item.date_end || moment(item.date_end).isSameOrAfter(date));
            });

            var price = self.lst_price;
            _.find(pricelist_items, function (rule) {
                console.log('pricelist_items', pricelist_items);
                console.log('rule', rule);
                console.log('rule.base', rule.base);
                if (rule.min_quantity && quantity < rule.min_quantity) {
                    return false;
                }

                if (rule.base === 'pricelist') {
                    price = self.get_price(rule.base_pricelist, quantity);
                } else if (rule.base === 'standard_price') {
                    console.log('self.standard_price', self.standard_price);
                    price = self.standard_price;
                }
                console.log('self.compute_price', self.compute_price);

                if (rule.compute_price === 'fixed') {
                    console.log('fixed');
                    price = rule.fixed_price;
                    return true;
                } else if (rule.compute_price === 'percentage') {
                    console.log('percentage');
                    price = price - (price * (rule.percent_price / 100));
                    return true;
                } else {
                    console.log('else');
                    var price_limit = price;
                    price = price - (price * (rule.price_discount / 100));
                    console.log('price.....', price)
                    if (rule.price_surcharge) {
                        console.log('surcharge');
                        price += rule.price_surcharge;
                    }
                    var price_charge = price;
                    var price_rounded = undefined;

                    if (rule.price_round) {
                        console.log('round');
                        price = round_pr(price, rule.price_round);
                        price_rounded = price;
                    }

                    if (price_rounded){
                        if (price_charge <= price_rounded){
                            price = price_rounded - 10;
                        }
                        else {
                            var diff = price_charge - price_rounded;
                            var diff2 = 90 - diff;
                            price = price_charge + diff2;
                        }
                    }


                    if (rule.price_min_margin) {
                        console.log('min');
                        price = Math.max(price, price_limit + rule.price_min_margin);
                    }
                    if (rule.price_max_margin) {
                        console.log('max');
                        price = Math.min(price, price_limit + rule.price_max_margin);
                    }
                    return true;
                }

                return false;
            });

            // This return value has to be rounded with round_di before
            // being used further. Note that this cannot happen here,
            // because it would cause inconsistencies with the backend for
            // pricelist that have base == 'pricelist'.
            console.log('price', price);
            return price;
        },
    });

});
