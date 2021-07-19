from itertools import chain

from odoo import api, fields, models, tools, _
from odoo.exceptions import UserError, ValidationError
from odoo.tools import float_repr
from odoo.tools.misc import get_lang


class PurchaseOrder(models.Model):
    _inherit = 'purchase.order'

    def button_confirm(self):
        print ('button_confirm')
        for line in self.order_line:
            print ('line', line)
            print ('partner', self.partner_id.name)
            line.product_id.supplier_id = self.partner_id.id
        return super(PurchaseOrder, self).button_confirm()

