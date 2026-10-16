
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"image_url": string | null,"is_active": boolean | null,"name": string,"slug": string,"sort_order": number | null
                  }
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean | null,"name": string,"slug": string,"sort_order"?: number | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean | null,"name"?: string,"slug"?: string,"sort_order"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"delivery_zones": {
                  Row: {
                    "created_at": string | null,"description": string | null,"fee": number,"id": string,"is_active": boolean | null,"name": string,"quote_after_payment": boolean | null,"sort_order": number | null
                  }
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"fee"?: number,"id"?: string,"is_active"?: boolean | null,"name": string,"quote_after_payment"?: boolean | null,"sort_order"?: number | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"fee"?: number,"id"?: string,"is_active"?: boolean | null,"name"?: string,"quote_after_payment"?: boolean | null,"sort_order"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"enquiries": {
                  Row: {
                    "buyer_type": string | null,"created_at": string | null,"id": string,"message": string,"name": string,"organisation": string | null,"phone": string,"status": string | null
                  }
                  Insert: {
                    "buyer_type"?: string | null,"created_at"?: string | null,"id"?: string,"message": string,"name": string,"organisation"?: string | null,"phone": string,"status"?: string | null
                  }
                  Update: {
                    "buyer_type"?: string | null,"created_at"?: string | null,"id"?: string,"message"?: string,"name"?: string,"organisation"?: string | null,"phone"?: string,"status"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"unit_price": number | null,"variant_id": string | null,"variant_label": string | null
                  }
                  Insert: {
                    "id"?: string,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"unit_price"?: number | null,"variant_id"?: string | null,"variant_label"?: string | null
                  }
                  Update: {
                    "id"?: string,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"unit_price"?: number | null,"variant_id"?: string | null,"variant_label"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "admin_notes": string | null,"attention_reason": string | null,"created_at": string | null,"customer_email": string | null,"customer_email_sent": boolean | null,"customer_name": string,"customer_phone": string,"delivery_fee": number | null,"delivery_location": string,"delivery_quote_pending": boolean | null,"delivery_zone_id": string | null,"delivery_zone_name": string | null,"expires_at": string | null,"has_price_on_request": boolean | null,"id": string,"needs_attention": boolean | null,"notes": string | null,"order_number": string,"paid_at": string | null,"payment_status": string,"public_token": string,"status": Database["public"]['Enums']["order_status"],"stock_deducted": boolean | null,"subtotal": number,"total": number | null,"vendor_email_sent": boolean | null
                  }
                  Insert: {
                    "admin_notes"?: string | null,"attention_reason"?: string | null,"created_at"?: string | null,"customer_email"?: string | null,"customer_email_sent"?: boolean | null,"customer_name": string,"customer_phone": string,"delivery_fee"?: number | null,"delivery_location": string,"delivery_quote_pending"?: boolean | null,"delivery_zone_id"?: string | null,"delivery_zone_name"?: string | null,"expires_at"?: string | null,"has_price_on_request"?: boolean | null,"id"?: string,"needs_attention"?: boolean | null,"notes"?: string | null,"order_number": string,"paid_at"?: string | null,"payment_status"?: string,"public_token"?: string,"status"?: Database["public"]['Enums']["order_status"],"stock_deducted"?: boolean | null,"subtotal"?: number,"total"?: number | null,"vendor_email_sent"?: boolean | null
                  }
                  Update: {
                    "admin_notes"?: string | null,"attention_reason"?: string | null,"created_at"?: string | null,"customer_email"?: string | null,"customer_email_sent"?: boolean | null,"customer_name"?: string,"customer_phone"?: string,"delivery_fee"?: number | null,"delivery_location"?: string,"delivery_quote_pending"?: boolean | null,"delivery_zone_id"?: string | null,"delivery_zone_name"?: string | null,"expires_at"?: string | null,"has_price_on_request"?: boolean | null,"id"?: string,"needs_attention"?: boolean | null,"notes"?: string | null,"order_number"?: string,"paid_at"?: string | null,"payment_status"?: string,"public_token"?: string,"status"?: Database["public"]['Enums']["order_status"],"stock_deducted"?: boolean | null,"subtotal"?: number,"total"?: number | null,"vendor_email_sent"?: boolean | null
                  }
                  Relationships: [
                    
                  ]
                },"payments": {
                  Row: {
                    "amount": number,"authorization_url": string | null,"channel": string | null,"created_at": string | null,"currency": string | null,"id": string,"order_id": string,"parent_payment_id": string | null,"paid_at": string | null,"paystack_transaction_id": string | null,"provider": string | null,"raw": Json | null,"reference": string,"status": string
                  }
                  Insert: {
                    "amount": number,"authorization_url"?: string | null,"channel"?: string | null,"created_at"?: string | null,"currency"?: string | null,"id"?: string,"order_id": string,"parent_payment_id"?: string | null,"paid_at"?: string | null,"paystack_transaction_id"?: string | null,"provider"?: string | null,"raw"?: Json | null,"reference": string,"status"?: string
                  }
                  Update: {
                    "amount"?: number,"authorization_url"?: string | null,"channel"?: string | null,"created_at"?: string | null,"currency"?: string | null,"id"?: string,"order_id"?: string,"parent_payment_id"?: string | null,"paid_at"?: string | null,"paystack_transaction_id"?: string | null,"provider"?: string | null,"raw"?: Json | null,"reference"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "payments_parent_payment_id_fkey"
      columns: ["parent_payment_id"]
isOneToOne: false
      referencedRelation: "payments"
      referencedColumns: ["id"]
    }
                  ]
                },"product_variants": {
                  Row: {
                    "id": string,"is_active": boolean | null,"label": string,"price": number | null,"product_id": string,"stock_quantity": number
                  }
                  Insert: {
                    "id"?: string,"is_active"?: boolean | null,"label": string,"price"?: number | null,"product_id": string,"stock_quantity"?: number
                  }
                  Update: {
                    "id"?: string,"is_active"?: boolean | null,"label"?: string,"price"?: number | null,"product_id"?: string,"stock_quantity"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "category_id": string | null,"compare_at_price": number | null,"created_at": string | null,"description": string | null,"id": string,"images": (string)[] | null,"is_active": boolean | null,"is_featured": boolean | null,"name": string,"price": number | null,"price_on_request": boolean | null,"short_description": string | null,"slug": string,"specs": Json | null,"stock_quantity": number,"track_stock": boolean | null,"updated_at": string | null
                  }
                  Insert: {
                    "category_id"?: string | null,"compare_at_price"?: number | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"images"?: (string)[] | null,"is_active"?: boolean | null,"is_featured"?: boolean | null,"name": string,"price"?: number | null,"price_on_request"?: boolean | null,"short_description"?: string | null,"slug": string,"specs"?: Json | null,"stock_quantity"?: number,"track_stock"?: boolean | null,"updated_at"?: string | null
                  }
                  Update: {
                    "category_id"?: string | null,"compare_at_price"?: number | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"images"?: (string)[] | null,"is_active"?: boolean | null,"is_featured"?: boolean | null,"name"?: string,"price"?: number | null,"price_on_request"?: boolean | null,"short_description"?: string | null,"slug"?: string,"specs"?: Json | null,"stock_quantity"?: number,"track_stock"?: boolean | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "address": string | null,"business_hours": string | null,"contact_email": string | null,"hero_subtitle": string | null,"hero_title": string | null,"id": number,"phone_number": string | null,"social_links": Json | null,"store_name": string | null,"updated_at": string | null,"whatsapp_number": string | null
                  }
                  Insert: {
                    "address"?: string | null,"business_hours"?: string | null,"contact_email"?: string | null,"hero_subtitle"?: string | null,"hero_title"?: string | null,"id"?: number,"phone_number"?: string | null,"social_links"?: Json | null,"store_name"?: string | null,"updated_at"?: string | null,"whatsapp_number"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"business_hours"?: string | null,"contact_email"?: string | null,"hero_subtitle"?: string | null,"hero_title"?: string | null,"id"?: number,"phone_number"?: string | null,"social_links"?: Json | null,"store_name"?: string | null,"updated_at"?: string | null,"whatsapp_number"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"webhook_events": {
                  Row: {
                    "event_key": string,"event_type": string | null,"id": string,"payload": Json | null,"processed_at": string | null,"provider": string | null
                  }
                  Insert: {
                    "event_key": string,"event_type"?: string | null,"id"?: string,"payload"?: Json | null,"processed_at"?: string | null,"provider"?: string | null
                  }
                  Update: {
                    "event_key"?: string,"event_type"?: string | null,"id"?: string,"payload"?: Json | null,"processed_at"?: string | null,"provider"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "decrement_stock":
{ Args: { "p_product_id": string,"p_quantity": number,"p_variant_id"?: string }; Returns: undefined
                           },
"expire_unpaid_orders":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"mark_order_paid":
{ Args: { "p_amount": number,"p_channel": string,"p_order_id": string,"p_raw": Json,"p_reference": string,"p_txn_id": string }; Returns: undefined
                           },
"restore_order_stock":
{ Args: { "p_order_id": string }; Returns: undefined
                           },
"restore_stock":
{ Args: { "p_product_id": string,"p_quantity": number,"p_variant_id"?: string }; Returns: undefined
                           },
"create_order_with_items_and_payment":
{ Args: { "p_order_number": string,"p_customer_name": string,"p_customer_email": string,"p_customer_phone": string,"p_delivery_location": string,"p_delivery_zone_id": string,"p_delivery_zone_name": string,"p_delivery_fee": number,"p_delivery_quote_pending": boolean,"p_notes": string,"p_subtotal": number,"p_total": number,"p_expires_at": string,"p_items": Json,"p_payment_reference": string,"p_payment_amount": number,"p_payment_currency"?: string,"p_payment_status"?: string }; Returns: { id: string, order_number: string, public_token: string }[]
                           }
          }
          Enums: {
            "order_status": "new"|"contacted"|"confirmed"|"completed"|"cancelled"|"pending_payment"|"paid"|"processing"|"out_for_delivery"|"delivered"|"expired"|"refunded"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "order_status": ["new", "contacted", "confirmed", "completed", "cancelled", "pending_payment", "paid", "processing", "out_for_delivery", "delivered", "expired", "refunded"]
          }
        }
} as const
