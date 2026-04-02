import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { Info, ListChecks, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { usePlan } from "../../hooks/plan/useGetAllplans";
import { usePurchasePlan } from "../../hooks/plan/usePurchasePlan";
import { usePurchasesByUser } from "../../hooks/plan/usePurchasesByUser";
import { PlanCard } from "./components/PlanCard";
import type { Plan } from "./components/PlanCard";

type PurchaseType = "FIRST_PURCHASE" | "REPURCHASE" | "SHARE_PURCHASE" | "";

export default function PlanPage() {
  const { data: plans = [], isLoading, isError, error } = usePlan();
  const { mutate: purchasePlan, isPending } = usePurchasePlan();
  const { data: purchaseData } = usePurchasesByUser();

  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentType, setPaymentType] = useState("");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("");
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Memoize active plan logic
  const activePlanNames = useMemo(() => {
    const purchases = (purchaseData as any)?.data?.purchases || purchaseData?.purchases || [];
    return new Set(purchases.filter((p: any) => p.status === "APPROVED").map((p: any) => p.planName));
  }, [purchaseData]);

  const hasPurchasedBefore = activePlanNames.size > 0;
  const showPurchaseTypeDropdown = (purchaseData as any)?.data?.purchaseFlow?.showPurchaseTypeDropdown ?? false;

  const handleOpen = (plan: Plan) => {
    setSelectedPlan(plan);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPlan(null);
    setPaymentType("");
    setPurchaseType("");
    setProofUrl("");
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "frontendfileupload");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dhuddbzui/image/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      setProofUrl(result.secure_url);
      toast.success("Payment proof uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedPlan) return;

    purchasePlan(
      {
        BV: selectedPlan.BV,
        dp_amount: selectedPlan.dp_amount,
        plan_amount: selectedPlan.price,
        payment_mode: paymentType,
        payment_proof_uri: proofUrl,
        purchase_type: showPurchaseTypeDropdown ? purchaseType : "FIRST_PURCHASE",
        plan_id: selectedPlan.id,
      },
      {
        onSuccess: () => {
          toast.success("Plan Purchased Successfully");
          handleClose();
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography color="error" variant="h6" fontWeight={700}>
          Oops! Something went wrong
        </Typography>
        <Typography color="text.secondary">{(error as Error).message}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header Section */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={4}
        mb={8}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Typography variant="overline" fontWeight={800} sx={{ color: "#6366f1", letterSpacing: "0.1em" }}>
              AVAILABLE PACKAGES
            </Typography>
          </Stack>
          <Typography variant="h3" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            Unlock Your Earnings
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, fontWeight: 500, maxWidth: "500px" }}>
            Choose a plan that fits your goals. Start small or go big for maximum benefits and daily rewards.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={4} alignItems="stretch">
        {plans.map((plan: Plan, index: number) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={plan.id}>
            <PlanCard
              plan={plan as any}
              isActive={activePlanNames.has(plan.planName)}
              onBuy={handleOpen}
              isPopular={index === 1} // Mark second plan as popular for visual balance
            />
          </Grid>
        ))}
      </Grid>

      {/* Benefits Info Box */}
      {/* <Box
        sx={{
          mt: 10,
          p: 4,
          borderRadius: 6,
          bgcolor: alpha("#6366f1", 0.03),
          border: "1px solid",
          borderColor: alpha("#6366f1", 0.1),
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 4,
            bgcolor: "#fff",
            boxShadow: "0 10px 20px rgba(99, 102, 241, 0.1)",
            display: "flex",
          }}
        >
          <Info size={32} color="#6366f1" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} color="#1e1b4b" gutterBottom>
            Flexible Upgrade Anytime
          </Typography>
          <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.6 }}>
            You can start with a basic plan and re-purchase higher tiers as your network grows.
            Higher BV plans unlock significantly better matching bonuses and daily income caps.
          </Typography>
        </Box>
      </Box> */}

      {/* Purchase Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 5 } }}>
        <DialogTitle sx={{ p: 4, pb: 2 }} component="div">
          <Typography variant="h5" fontWeight={900}>Confirm Package Selection</Typography>
          <Typography variant="caption" color="text.secondary">Step through to complete your purchase</Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 4, py: 1 }}>
          {selectedPlan && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Paper sx={{ p: 2.5, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="#64748b">Selected Plan</Typography>
                    <Typography variant="h6" fontWeight={800}>{selectedPlan.planName}</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={900} color="primary">₹{selectedPlan.price}</Typography>
                </Stack>
              </Paper>

              {showPurchaseTypeDropdown && (
                <FormControl fullWidth size="small">
                  <InputLabel>Transaction Mode</InputLabel>
                  <Select
                    value={purchaseType}
                    label="Transaction Mode"
                    onChange={(e: any) => setPurchaseType(e.target.value as PurchaseType)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="REPURCHASE">Re-Purchase (Standard Upgrade)</MenuItem>
                    <MenuItem value="SHARE_PURCHASE">Share-Purchase (Team Assignment)</MenuItem>
                  </Select>
                </FormControl>
              )}

              <FormControl fullWidth size="small">
                <InputLabel>Payment Source</InputLabel>
                <Select
                  value={paymentType}
                  label="Payment Source"
                  onChange={(e: any) => setPaymentType(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="UPI">UPI Transfer (Instant)</MenuItem>
                  <MenuItem value="Bank">Direct Bank Transfer</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ p: 3, bgcolor: alpha("#1e293b", 0.02), borderRadius: 4, border: "1px solid #e2e8f0", textAlign: "center" }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" mb={2}>
                  SCAN TO COMPLETE PAYMENT
                </Typography>
                <Box
                  component="img"
                  src="https://static.vecteezy.com/system/resources/previews/017/441/744/original/qr-code-icon-qr-code-sample-for-smartphone-scanning-isolated-illustration-vector.jpg"
                  sx={{ width: 160, height: 160, mx: "auto", borderRadius: 2, mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Transfer ₹{selectedPlan.price} then upload the receipt below.
                </Typography>
              </Box>

              <Button
                component="label"
                variant="outlined"
                fullWidth
                sx={{ py: 1.5, borderRadius: 3, borderStyle: "dashed", fontWeight: 700 }}
              >
                {uploading ? "Uploading..." : proofUrl ? "Change Proof" : "Upload Payment Screenshot"}
                <input hidden type="file" onChange={handleProofUpload} />
              </Button>

              {proofUrl && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1, bgcolor: "#f0fdf4", borderRadius: 2, border: "1px solid #dcfce7" }}>
                  <Box component="img" src={proofUrl} sx={{ width: 48, height: 48, borderRadius: 1.5, objectFit: "cover" }} />
                  <Typography variant="caption" fontWeight={700} color="#166534">Receipt verified for submission</Typography>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button onClick={handleClose} sx={{ color: "text.secondary", fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            fullWidth
            disabled={!paymentType || !proofUrl || isPending || (hasPurchasedBefore && !purchaseType)}
            sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)" }}
          >
            {isPending ? "Configuring Account..." : "Confirm & Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}