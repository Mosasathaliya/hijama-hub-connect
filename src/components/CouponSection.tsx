import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag,
  Calendar,
  Percent,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

const couponSchema = z.object({
  code: z.string().min(3, "كود الكوبون يجب أن يكون 3 أحرف على الأقل"),
  discount_type: z.enum(["percentage", "fixed"], { required_error: "نوع الخصم مطلوب" }),
  discount_value: z.number().min(0.01, "قيمة الخصم يجب أن تكون أكثر من 0"),
  max_uses: z.number().min(1, "عدد الاستخدامات يجب أن يكون 1 على الأقل"),
  expiry_date: z.string().min(1, "تاريخ الانتهاء مطلوب"),
  is_active: z.boolean().default(true)
});

type CouponFormData = z.infer<typeof couponSchema>;
type Coupon = Tables<"coupons">;

interface CouponSectionProps {
  onBack?: () => void;
}

const CouponSection = ({ onBack }: CouponSectionProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      is_active: true,
      discount_type: "percentage"
    }
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الكوبونات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from("coupons")
          .update({
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            max_uses: data.max_uses,
            expiry_date: data.expiry_date,
            is_active: data.is_active
          })
          .eq("id", editingCoupon.id);

        if (error) throw error;

        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث الكوبون بنجاح",
        });
      } else {
        // Create new coupon
        const { error } = await supabase
          .from("coupons")
          .insert({
            code: data.code.toUpperCase(),
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            max_uses: data.max_uses,
            expiry_date: data.expiry_date,
            is_active: data.is_active,
            used_count: 0
          });

        if (error) throw error;

        toast({
          title: "تم الإضافة بنجاح",
          description: "تم إضافة الكوبون بنجاح",
        });
      }

      fetchCoupons();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ الكوبون",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      discount_type: coupon.discount_type as "percentage" | "fixed",
      discount_value: Number(coupon.discount_value),
      max_uses: coupon.max_uses,
      expiry_date: coupon.expiry_date,
      is_active: coupon.is_active
    });
    setShowEditDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الكوبون بنجاح",
      });

      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الكوبون",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!isActive ? "تفعيل" : "إلغاء تفعيل"} الكوبون`,
      });

      fetchCoupons();
    } catch (error) {
      console.error("Error toggling coupon status:", error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث حالة الكوبون",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingCoupon(null);
    form.reset();
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    return coupon.discount_type === "percentage" 
      ? `${coupon.discount_value}%` 
      : `${coupon.discount_value} ريال`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button onClick={onBack} variant="outline">
              العودة للوحة التحكم
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-primary">إدارة الكوبونات</h2>
            <p className="text-muted-foreground">إدارة كوبونات الخصم والعروض</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCoupons} variant="outline">
            تحديث
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة كوبون جديد
          </Button>
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            الكوبونات ({coupons.length})
          </CardTitle>
          <CardDescription>جميع كوبونات الخصم في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد كوبونات حالياً</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود الكوبون</TableHead>
                  <TableHead>نوع الخصم</TableHead>
                  <TableHead>قيمة الخصم</TableHead>
                  <TableHead>الاستخدامات</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {coupon.discount_type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {getDiscountDisplay(coupon)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={coupon.used_count >= coupon.max_uses ? "text-red-600" : ""}>
                        {coupon.used_count} / {coupon.max_uses}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={isExpired(coupon.expiry_date) ? "text-red-600" : ""}>
                        {format(new Date(coupon.expiry_date), "dd/MM/yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      >
                        <Badge variant={coupon.is_active ? "default" : "secondary"}>
                          {coupon.is_active ? "مفعل" : "غير مفعل"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Coupon Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingCoupon ? "تعديل الكوبون" : "إضافة كوبون جديد"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">كود الكوبون *</Label>
              <Input
                id="code"
                {...form.register("code")}
                placeholder="أدخل كود الكوبون"
                className="uppercase"
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>نوع الخصم *</Label>
              <Select 
                value={form.watch("discount_type")} 
                onValueChange={(value: "percentage" | "fixed") => form.setValue("discount_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الخصم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                  <SelectItem value="fixed">مبلغ ثابت (ريال)</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.discount_type && (
                <p className="text-sm text-destructive">{form.formState.errors.discount_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                قيمة الخصم * {form.watch("discount_type") === "percentage" ? "(%)" : "(ريال)"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                {...form.register("discount_value", { valueAsNumber: true })}
                placeholder={form.watch("discount_type") === "percentage" ? "مثال: 10" : "مثال: 50"}
              />
              {form.formState.errors.discount_value && (
                <p className="text-sm text-destructive">{form.formState.errors.discount_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_uses">عدد مرات الاستخدام *</Label>
              <Input
                id="max_uses"
                type="number"
                {...form.register("max_uses", { valueAsNumber: true })}
                placeholder="مثال: 100"
              />
              {form.formState.errors.max_uses && (
                <p className="text-sm text-destructive">{form.formState.errors.max_uses.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">تاريخ الانتهاء *</Label>
              <Input
                id="expiry_date"
                type="date"
                {...form.register("expiry_date")}
              />
              {form.formState.errors.expiry_date && (
                <p className="text-sm text-destructive">{form.formState.errors.expiry_date.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                إلغاء
              </Button>
              <Button type="submit" variant="healing" className="flex-1">
                {editingCoupon ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponSection;