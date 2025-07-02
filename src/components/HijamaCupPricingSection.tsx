import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface HijamaCupPrice {
  id: string;
  number_of_cups: number;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HijamaCupPricingSectionProps {
  onBack: () => void;
}

const HijamaCupPricingSection = ({ onBack }: HijamaCupPricingSectionProps) => {
  const [prices, setPrices] = useState<HijamaCupPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      number_of_cups: "",
      price: "",
      description: "",
      is_active: true,
    },
  });

  const editForm = useForm({
    defaultValues: {
      number_of_cups: "",
      price: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const { data, error } = await supabase
        .from("hijama_cup_prices")
        .select("*")
        .order("number_of_cups", { ascending: true });

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الأسعار",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: any) => {
    try {
      const { error } = await supabase
        .from("hijama_cup_prices")
        .insert([
          {
            number_of_cups: parseInt(values.number_of_cups),
            price: parseFloat(values.price),
            description: values.description || null,
            is_active: values.is_active,
          },
        ]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إضافة التسعيرة بنجاح",
      });

      form.reset();
      setShowAddForm(false);
      fetchPrices();
    } catch (error) {
      console.error("Error adding price:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة التسعيرة",
        variant: "destructive",
      });
    }
  };

  const onEditSubmit = async (values: any) => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from("hijama_cup_prices")
        .update({
          number_of_cups: parseInt(values.number_of_cups),
          price: parseFloat(values.price),
          description: values.description || null,
          is_active: values.is_active,
        })
        .eq("id", editingId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث التسعيرة بنجاح",
      });

      setEditingId(null);
      editForm.reset();
      fetchPrices();
    } catch (error) {
      console.error("Error updating price:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث التسعيرة",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (price: HijamaCupPrice) => {
    setEditingId(price.id);
    editForm.reset({
      number_of_cups: price.number_of_cups.toString(),
      price: price.price.toString(),
      description: price.description || "",
      is_active: price.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("hijama_cup_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف التسعيرة بنجاح",
      });

      fetchPrices();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف التسعيرة",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-healing flex items-center justify-center">
        <div className="text-xl text-primary">جار التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-healing">
      {/* Header */}
      <div className="bg-card shadow-soft border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              رجوع
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">أسعار كؤوس الحجامة</h1>
              <p className="text-sm text-muted-foreground">إدارة أسعار كؤوس الحجامة</p>
            </div>
          </div>
          <Button
            variant="healing"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة تسعيرة جديدة
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Add Form */}
        {showAddForm && (
          <Card className="mb-8 border-primary/10">
            <CardHeader>
              <CardTitle>إضافة تسعيرة جديدة</CardTitle>
              <CardDescription>أدخل عدد الكؤوس والسعر المطلوب</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="number_of_cups"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عدد الكؤوس</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="أدخل عدد الكؤوس"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>السعر (ريال سعودي)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="أدخل السعر"
                              {...field}
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">نشط</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وصف (اختياري)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أدخل وصف للتسعيرة (اختياري)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" variant="healing">
                      حفظ
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        form.reset();
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Prices Table */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>قائمة الأسعار</CardTitle>
            <CardDescription>
              إدارة أسعار كؤوس الحجامة المختلفة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد أسعار مضافة حتى الآن
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عدد الكؤوس</TableHead>
                    <TableHead>السعر</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell>
                        {editingId === price.id ? (
                          <Form {...editForm}>
                            <FormField
                              control={editForm.control}
                              name="number_of_cups"
                              render={({ field }) => (
                                <Input type="number" {...field} className="w-24" />
                              )}
                            />
                          </Form>
                        ) : (
                          price.number_of_cups
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === price.id ? (
                          <FormField
                            control={editForm.control}
                            name="price"
                            render={({ field }) => (
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                className="w-24"
                              />
                            )}
                          />
                        ) : (
                          `${price.price} ر.س`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === price.id ? (
                          <FormField
                            control={editForm.control}
                            name="description"
                            render={({ field }) => (
                              <Input {...field} className="w-32" />
                            )}
                          />
                        ) : (
                          price.description || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === price.id ? (
                          <FormField
                            control={editForm.control}
                            name="is_active"
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        ) : (
                          <span
                            className={
                              price.is_active
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {price.is_active ? "نشط" : "غير نشط"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(price.created_at).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingId === price.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="healing"
                                onClick={editForm.handleSubmit(onEditSubmit)}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  editForm.reset();
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(price)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(price.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HijamaCupPricingSection;