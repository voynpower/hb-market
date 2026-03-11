ALTER TABLE `addresses`
  ADD CONSTRAINT `fk_addresses_user`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `product_options`
  ADD CONSTRAINT `fk_product_options_product`
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `carts`
  ADD CONSTRAINT `fk_carts_user`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_cart`
  FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`);

ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_product`
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `cart_items`
  ADD CONSTRAINT `fk_cart_items_product_option`
  FOREIGN KEY (`product_option_id`) REFERENCES `product_options` (`id`);

ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_address`
  FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order`
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_product`
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_product_option`
  FOREIGN KEY (`product_option_id`) REFERENCES `product_options` (`id`);

ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_order`
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

ALTER TABLE `shipments`
  ADD CONSTRAINT `fk_shipments_order`
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);
