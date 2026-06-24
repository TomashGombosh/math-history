import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useState } from "react";
import type { ReportComponent } from "../state/ReportContenxt";

type Props = {
    open: boolean;
    component: ReportComponent | null;
    onClose: () => void;
}

type PayloadType = { 
    email:string;
    comment:string;
    component: ReportComponent
}

const ReportDialog = ({ open, component, onClose }: Props) => {
    const [email, setEmail] = useState<string>("");
    const [comment, setComment] = useState<string>("")
    const handleSubmit = async () => {
        if (!component) return;

        const payload:PayloadType = {
            email,
            comment,
            component:{
                type: component?.type,
                id: component?.id,
                label:component?.label,
                url: component?.url
                
            }
        }
        console.log(payload)

        setEmail("");
        setComment("");
        onClose();
    }


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            Повідомити про проблему
        </DialogTitle>
        <DialogContent>
            <Typography mb={2}>
                Компонент: <strong>{component?.label}</strong>
            </Typography>
            <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                label="Коментар"
                type="text"
                fullWidth
                margin="normal"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={4}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>
                Скасувати
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
                Надіслати
            </Button>
        </DialogActions>
    </Dialog>
  )
}

export default ReportDialog